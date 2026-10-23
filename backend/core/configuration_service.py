from copy import deepcopy
from decimal import Decimal
from django.db import transaction
from django_q.models import Schedule
from config.app_configuration import ConfigurationError, validate_document
from .models import AuditLog, ProcessingConfig, Source


def check_source_conflicts(document):
    validate_document(deepcopy(document))
    for item in document['sources']:
        if Source.objects.filter(url=item['url']).exclude(pk=item['id']).exists():
            raise ConfigurationError(f'La URL de {item["id"]} ya pertenece a otra fuente; conserva su identificador.')


@transaction.atomic
def apply_configuration(loaded):
    document = validate_document(deepcopy(loaded.document))
    policy, _ = ProcessingConfig.objects.get_or_create(pk=1)
    policy = ProcessingConfig.objects.select_for_update().get(pk=policy.pk)
    check_source_conflicts(document)
    created = updated = 0
    ids = {item['id'] for item in document['sources']}
    for item in document['sources']:
        source, fresh = Source.objects.get_or_create(pk=item['id'], defaults={key: value for key, value in item.items() if key != 'id'})
        if fresh:
            created += 1
            continue
        changes = [key for key, value in item.items() if key != 'id' and getattr(source, key) != value]
        for key in changes:
            setattr(source, key, item[key])
        if changes:
            source.save(update_fields=changes)
            updated += 1
    archived = Source.objects.exclude(pk__in=ids).filter(enabled=True).update(enabled=False)
    previous = AuditLog.objects.filter(action='configuration.apply', target='application').order_by('-id').first()
    changed = not previous or previous.details.get('revision') != loaded.revision or created or updated or archived
    policy.retrieval = document['collection']['retrieval']
    policy.frequency = document['processing']['frequency']
    policy.budget = Decimal(str(document['processing']['budget_eur']))
    if changed:
        policy.version += 1
    policy.save()
    Schedule.objects.update_or_create(name='galicia-source-scheduler', defaults={
        'func': 'core.tasks.schedule_sources', 'schedule_type': Schedule.MINUTES,
        'minutes': document['collection']['scheduler_minutes'], 'repeats': -1})
    if changed:
        AuditLog.objects.create(action='configuration.apply', target='application', details={
            'revision': loaded.revision, 'profile': loaded.profile, 'sources': len(ids),
            'created': created, 'updated': updated, 'archived': archived})
    return {'created': created, 'updated': updated, 'archived': archived}
