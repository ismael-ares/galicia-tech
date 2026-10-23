import hashlib
import json
import time
from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django_q.tasks import async_task
from .extraction import PageParser, canonical, detail_links, event_nodes, normalize
from .fetching import fetch_html
from .models import CollectionRun, Event, Observation, ReviewCase, Source
from .services import processing_config


def enqueue_source(source_id):
    with transaction.atomic():
        source = Source.objects.select_for_update().get(pk=source_id, enabled=True, id__in=settings.MANAGED_SOURCE_IDS)
        run = CollectionRun.objects.filter(source=source, status__in=['queued', 'running']).first()
        if not run:
            run = CollectionRun.objects.create(source=source)
            # Queue and logical job commit atomically in the same PostgreSQL database.
            async_task('core.tasks.collect_source', str(run.id), task_name='source-' + str(run.id))
        return run


def collect_source(run_id):
    if not settings.COLLECTION_ENABLED:
        CollectionRun.objects.filter(pk=run_id).update(status='disabled', finished_at=timezone.now())
        return
    with transaction.atomic():
        run = CollectionRun.objects.select_for_update().select_related('source').get(pk=run_id)
        if run.status in ('completed', 'partial', 'disabled') or run.attempts >= 2:
            return
        run.status = 'running'; run.attempts += 1; run.save()
    if not run.source.enabled or run.source_id not in settings.MANAGED_SOURCE_IDS:
        CollectionRun.objects.filter(pk=run_id).update(status='disabled', finished_at=timezone.now()); return
    deadline = time.monotonic() + settings.COLLECTION_DEADLINE
    found = []; errors = []
    try:
        document, url = fetch_html(run.source.url)
        parser = PageParser(); parser.feed(document)
        nodes = [node for data in parser.jsonld for node in event_nodes(data)]
        for link in detail_links(parser, url):
            if time.monotonic() > deadline:
                errors.append('Consulta parcial: límite de tiempo.'); break
            try:
                text, final = fetch_html(link)
                detail = PageParser(); detail.feed(text)
                nodes.extend({**node, 'url': node.get('url') or final} for data in detail.jsonld for node in event_nodes(data))
            except Exception:
                errors.append('No se ha podido interpretar una ficha enlazada.')
        for node in nodes[:settings.COLLECTION_MAX_EVENTS]:
            try:
                data = normalize(node, run.source, url)
                fingerprint = hashlib.sha256(json.dumps(data, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
                with transaction.atomic():
                    _, created = Observation.objects.get_or_create(source=run.source, fingerprint=fingerprint, defaults={'data': data})
                    if not created: continue
                    event_url = data['sources'][0]['url']
                    data['id'] = hashlib.sha256(event_url.encode()).hexdigest()[:24]
                    event, is_new = Event.objects.get_or_create(canonical_url=event_url, defaults={
                        'id': data['id'], 'title': data['title'], 'start': parse_datetime(data['start']),
                        'end': parse_datetime(data['end']) if data['end'] else None, 'city': data['city'],
                        'community': data['community'], 'base_data': data, 'data': data})
                    event.sources.add(run.source)
                    case_data = {'title': data['title'], 'summary': 'Nueva convocatoria o cambio detectado en la fuente. Contrasta los datos antes de publicar.',
                                 'type': 'Cancelación' if data['sourceStatus'].endswith('EventCancelled') else 'Convocatoria', 'cancelled': data['sourceStatus'].endswith('EventCancelled'), 'published': event.published, 'field': {'kind': 'confirmation', 'label': 'Datos de la convocatoria', 'options': []},
                                 'approvedPatch': {**data, 'id': event.id, 'statusNote': ''},
                                 'evidence': [{'label': 'Convocatoria oficial', 'value': data['title'], 'detail': data['start'] + ' · ' + data['place'], 'url': event_url}]}
                    ReviewCase.objects.get_or_create(pk='observed-' + fingerprint[:32], defaults={'event': event, 'data': case_data})
                found.append(event.id)
            except (ValueError, TypeError, IntegrityError):
                errors.append('Una convocatoria requiere extracción manual; observación no publicada.')
        if not nodes:
            errors.append('No se han encontrado eventos estructurados. No se interpreta como cancelación ni como extracción completa.')
        Source.objects.filter(pk=run.source_id).update(checked_at=timezone.now(), last_error=' '.join(errors)[:500])
        CollectionRun.objects.filter(pk=run_id).update(status='partial' if errors else 'completed', count=len(found), error=' '.join(errors)[:500], finished_at=timezone.now())
    except Exception:
        message = 'No se ha podido consultar la fuente. Se conserva el catálogo existente.'
        Source.objects.filter(pk=run.source_id).update(last_error=message)
        CollectionRun.objects.filter(pk=run_id).update(status='failed', error=message, finished_at=timezone.now())
        raise RuntimeError(message) from None


def schedule_sources():
    if not settings.COLLECTION_ENABLED: return
    config = processing_config()
    interval = timezone.timedelta(hours=settings.COLLECTION_INTERVAL_HOURS)
    now = timezone.now()
    CollectionRun.objects.filter(status__in=['queued', 'running'], created_at__lt=now-timezone.timedelta(minutes=settings.COLLECTION_STALE_MINUTES)).update(status='failed', error='Trabajo interrumpido; disponible para una nueva consulta.', finished_at=now)
    if config['retrieval'] == 'twice-weekly' and timezone.localtime(now).weekday() not in settings.COLLECTION_WEEKDAYS: return
    for source in Source.objects.filter(enabled=True, id__in=settings.MANAGED_SOURCE_IDS):
        latest = CollectionRun.objects.filter(source=source).order_by('-created_at').first()
        if latest and latest.created_at > now - interval: continue
        try:
            enqueue_source(source.id)
        except (IntegrityError, Source.DoesNotExist):
            continue
