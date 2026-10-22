import json
from pathlib import Path
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime
from core.models import Event, ReviewCase, Source
from core.services import render_event

def text_values(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values(): yield from text_values(child)
    elif isinstance(value, list):
        for child in value: yield from text_values(child)

class Command(BaseCommand):
    help = 'Explicitly import the October 2026 sample; never overwrites existing records.'
    def add_arguments(self, parser):
        parser.add_argument('--path', default='/app/sample/sample.json')
        parser.add_argument('--translations', default='/app/sample/events-gl.json')
    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(Path(options['path']).read_text())
        translations = json.loads(Path(options['translations']).read_text())
        for item in data['sources']:
            Source.objects.get_or_create(pk=item['id'], defaults={k: item[k] for k in ('name', 'url', 'city', 'platform', 'enabled')})
        raw = {item['id']: item for item in data['events']}
        for case in data['cases']:
            if case.get('candidate') and case['eventId'] not in raw:
                raw[case['eventId']] = case['candidate']
        covers = {c['id']: c.get('selected') for c in data['covers']}
        for item in raw.values():
            texts = set(text_values([item, *[case for case in data['cases'] if case['eventId'] == item['id']]]))
            event, created = Event.objects.get_or_create(pk=item['id'], defaults={
                'canonical_url': item['sources'][0]['url'], 'title': item['title'], 'start': parse_datetime(item['start']),
                'end': parse_datetime(item['end']) if item.get('end') else None, 'city': item['city'],
                'community': item['community'], 'base_data': item, 'data': item,
                'base_published': item['id'] in {e['id'] for e in data['events']}, 'is_sample': True,
                'cover': covers.get(item['id']), 'translations': {k:v for k,v in translations.items() if k in texts}})
            if created:
                event.sources.set(Source.objects.filter(pk__in=item.get('sourceIds', [])))
        for item in data['cases']:
            default = item.get('defaultDecision', {})
            case, created = ReviewCase.objects.get_or_create(pk=item['id'], defaults={'event_id': item['eventId'],
                'data': {k: v for k, v in item.items() if k not in ('candidate', 'defaultDecision')},
                'status': default.get('status', 'pending'), 'value': default.get('value', ''), 'note': default.get('note', '')})
            if created and not item.get('published', False):
                Event.objects.filter(pk=item['eventId']).update(base_published=False)
        for event in Event.objects.filter(is_sample=True):
            render_event(event)
        self.stdout.write(self.style.SUCCESS('Sample imported without replacing existing records.'))
