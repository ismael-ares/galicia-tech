from django.core.management.base import BaseCommand
from django_q.models import Schedule

class Command(BaseCommand):
    help = 'Idempotently register the hourly source scheduler; downloads remain controlled by COLLECTION_ENABLED.'
    def handle(self, *args, **options):
        Schedule.objects.update_or_create(name='galicia-source-scheduler', defaults={
            'func': 'core.tasks.schedule_sources', 'schedule_type': Schedule.HOURLY, 'repeats': -1})
        self.stdout.write('Source scheduler configured. Paid LLM calls remain unavailable.')
