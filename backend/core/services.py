from copy import deepcopy
from datetime import datetime
from decimal import Decimal, InvalidOperation
from urllib.parse import urlsplit
import yaml
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.dateparse import parse_datetime
from rest_framework.exceptions import ValidationError as APIValidationError
from .models import AuditLog, Event, ProcessingConfig, ReviewCase


def public_url(value):
    try:
        url = urlsplit(value)
        if url.scheme not in ('http', 'https') or not url.hostname or url.username or url.password:
            raise ValueError()
    except (ValueError, TypeError):
        raise APIValidationError('Introduce un enlace HTTP o HTTPS válido, sin credenciales.')
    return value


def render_event(event):
    data = deepcopy(event.base_data)
    published = event.base_published
    for case in event.reviews.order_by('updated_at', 'id'):
        if case.status == 'discarded':
            published = False
            break
        if case.status == 'pending' and not case.data.get('published', False):
            published = False
        if case.status == 'approved':
            if not case.data.get('published', False):
                published = True
            field = case.data['field']
            if field['kind'] == 'choice':
                option = next((item for item in field['options'] if item['value'] == case.value), None)
                if option:
                    data.update(deepcopy(option.get('patch', {})))
            elif field['kind'] == 'url':
                data['registration'] = {'label': field.get('linkLabel', 'Inscripción'), 'url': case.value}
            elif field['kind'] == 'confirmation':
                pass
            data.update(deepcopy(case.data.get('approvedPatch', {})))
    event.data = data
    event.published = published and not event.reviews.filter(status='discarded').exists() and not any(c.status == 'pending' and not c.data.get('published', False) for c in event.reviews.all())
    event.title = data['title']
    event.city = data['city']
    event.community = data['community']
    event.start = parse_datetime(data['start'])
    event.end = parse_datetime(data['end']) if data.get('end') else None
    event.save()


@transaction.atomic
def decide_case(case_id, actor, values):
    # Every review of the same event takes the event lock before the case lock.
    event_id = ReviewCase.objects.get(pk=case_id).event_id
    event = Event.objects.select_for_update().get(pk=event_id)
    case = ReviewCase.objects.select_for_update().get(pk=case_id)
    if values['version'] != case.version:
        from rest_framework.exceptions import APIException
        error = APIException('Otro cambio ha actualizado este caso. Recarga antes de revisarlo.'); error.status_code = 409
        raise error
    status, value = values['status'], values.get('value', '')
    if status == 'approved' and case.data.get('cancelled'):
        raise APIValidationError('La fuente indica cancelación. Contrasta el aviso y descarta la convocatoria para retirarla de la agenda.')
    if status == 'approved':
        field = case.data['field']
        if field['kind'] == 'url':
            public_url(value)
        elif field['kind'] == 'choice' and value not in [o['value'] for o in field['options']]:
            raise APIValidationError({'value': 'Selecciona un valor contrastado.'})
        elif field['kind'] == 'confirmation' and value != 'confirmed':
            raise APIValidationError({'value': 'Confirma los datos de la convocatoria.'})
    case.status = status
    case.value = value
    case.note = values.get('note', '')
    case.version += 1
    case.save()
    render_event(event)
    AuditLog.objects.create(actor=actor, action='review.' + status, target=case.id, details={'version': case.version})
    return case


def processing_config():
    config, _ = ProcessingConfig.objects.get_or_create(pk=1)
    values = {'authority': settings.CONFIG_AUTHORITY, 'retrieval': config.retrieval, 'frequency': config.frequency,
              'budget': str(config.budget), 'version': config.version, 'paidCallsEnabled': False}
    if settings.CONFIG_AUTHORITY == 'yaml':
        # Validate first; an invalid reload leaves the last accepted database copy intact.
        try:
            with open(settings.CONFIG_YAML_PATH) as handle:
                document = yaml.safe_load(handle)
            section = document['processing']
            retrieval, frequency = section['retrieval'], section['frequency']
            budget = Decimal(str(section['budget_eur']))
            if retrieval not in ('daily', 'twice-weekly') or frequency not in ('twice-weekly', 'every-three-days') or not 0 <= budget <= 5:
                raise ValueError('Invalid processing values')
            if section.get('paid_calls_enabled', False):
                raise ValueError('Paid calls are unavailable in this release')
            values.update(retrieval=retrieval, frequency=frequency, budget=str(budget))
            ProcessingConfig.objects.filter(pk=1).update(retrieval=retrieval, frequency=frequency, budget=budget)
        except (OSError, ValueError, TypeError, KeyError, InvalidOperation, yaml.YAMLError):
            values['warning'] = 'El YAML no es válido; se conserva la última configuración aceptada.'
    return values
