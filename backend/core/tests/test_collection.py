import socket
from unittest.mock import patch
from django.test import SimpleTestCase, TestCase, override_settings
from core.extraction import PageParser, event_nodes
from core.fetching import fetch_html
from core.models import CollectionRun, Event, Observation, ReviewCase, Source
from core.tasks import collect_source

class FetchTests(SimpleTestCase):
    @override_settings(FETCH_ALLOWED_HOSTS=['trusted.example'])
    def test_private_dns_and_untrusted_hosts_never_connect(self):
        for url in ('http://trusted.example/', 'https://127.0.0.1/', 'https://other.example/', 'https://user:password@trusted.example/'):
            with self.assertRaises(ValueError): fetch_html(url)
        with patch('socket.getaddrinfo', return_value=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('127.0.0.1',443))]):
            with self.assertRaises(ValueError): fetch_html('https://trusted.example/')
    def test_multitype_jsonld_events(self):
        parser = PageParser();parser.feed('<script type="application/ld+json">{"@graph":[{"@type":["Event","Thing"],"name":"A"}]}</script>')
        self.assertEqual(len(list(event_nodes(parser.jsonld))), 1)

@override_settings(COLLECTION_ENABLED=True)
class CollectionTests(TestCase):
    def setUp(self):
        self.source=Source.objects.create(id='test',name='Trusted',city='A Coruña',platform='Web',url='https://gpul.org/')
        self.page='''<script type="application/ld+json">{"@type":"Event","name":"A real event","startDate":"2026-12-01T18:00:00+01:00","url":"https://gpul.org/eventos/test","location":{"name":"Campus","address":{"addressLocality":"A Coruña"}}}</script>'''
    def run_once(self):
        run=CollectionRun.objects.create(source=self.source)
        with patch('core.tasks.fetch_html',return_value=(self.page,self.source.url)):
            collect_source(str(run.id))
        return run
    def test_new_data_is_reviewed_and_retries_do_not_duplicate(self):
        run=self.run_once();collect_source(str(run.id));self.run_once()
        self.assertEqual(Event.objects.count(),1)
        self.assertEqual(Observation.objects.count(),1)
        self.assertEqual(ReviewCase.objects.count(),1)
        self.assertFalse(Event.objects.first().published)
    def test_failed_source_does_not_cancel_existing_events(self):
        self.run_once();event=Event.objects.first();event.published=True;event.save()
        run=CollectionRun.objects.create(source=self.source)
        with patch('core.tasks.fetch_html',side_effect=ValueError('network')):
            with self.assertRaises(RuntimeError): collect_source(str(run.id))
        event.refresh_from_db();self.assertTrue(event.published)

    def test_second_observation_of_a_draft_also_requires_approval(self):
        self.run_once()
        self.page = self.page.replace('A real event', 'An updated title')
        self.run_once()
        self.assertEqual(ReviewCase.objects.count(), 2)
        self.assertTrue(all(not case.data['published'] for case in ReviewCase.objects.all()))
