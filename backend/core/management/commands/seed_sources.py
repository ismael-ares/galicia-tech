import json
from pathlib import Path
from django.core.management.base import BaseCommand
from core.models import Source

class Command(BaseCommand):
    help = 'Load only the thirteen selected sources. Does not import events or overwrite edits.'
    def handle(self, *args, **options):
        data = json.loads((Path(__file__).resolve().parents[3]/'sample'/'sample.json').read_text())
        for item in data['sources']:
            Source.objects.get_or_create(pk=item['id'], defaults={k:item[k] for k in ('name','url','city','platform','enabled')})
        self.stdout.write('Selected sources loaded. No event data imported and no external requests made.')
