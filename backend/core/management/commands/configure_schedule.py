from django.core.management.base import BaseCommand
from django.conf import settings
from django_q.models import Schedule

class Command(BaseCommand):
    help = 'Idempotently register the scheduler cadence declared in app.yaml.'
    def handle(self, *args, **options):
        Schedule.objects.update_or_create(name='galicia-source-scheduler', defaults={
            'func': 'core.tasks.schedule_sources', 'schedule_type': Schedule.MINUTES, 'minutes': settings.SCHEDULER_MINUTES, 'repeats': -1})
        self.stdout.write('Source scheduler configured. Paid LLM calls remain unavailable.')
