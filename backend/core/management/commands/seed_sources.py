from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Compatibility alias: synchronize the versioned YAML, never seed sources from samples.'
    def handle(self, *args, **options):
        call_command('sync_configuration', stdout=self.stdout)
