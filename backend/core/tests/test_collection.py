import socket
from datetime import datetime, timezone as dt_timezone, timedelta
from unittest.mock import Mock, patch
from django.test import SimpleTestCase, TestCase, override_settings
from core.extraction import PageParser, detail_links, event_nodes
from core.fetching import fetch_html
from core.models import CollectionRun, Event, Observation, ReviewCase, Source
from core.tasks import collect_source, schedule_sources

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

    @override_settings(FETCH_ALLOWED_HOSTS=['trusted.example'], FETCH_MAX_BYTES=10, FETCH_CONNECT_TIMEOUT=2, FETCH_READ_TIMEOUT=3)
    def test_download_uses_configured_size_and_time_limits(self):
        response = Mock(status=200, headers={'Content-Type': 'text/html'})
        response.read.return_value = b'x'*11
        with patch('socket.getaddrinfo', return_value=[(socket.AF_INET,socket.SOCK_STREAM,6,'',('8.8.8.8',443))]), patch('core.fetching.urllib3.HTTPSConnectionPool') as pool:
            pool.return_value.request.return_value = response
            with self.assertRaises(ValueError): fetch_html('https://trusted.example/')
            response.read.assert_called_once_with(11, decode_content=False)
            self.assertEqual(pool.call_args.kwargs['timeout'].connect_timeout, 2)
            self.assertEqual(pool.call_args.kwargs['timeout'].read_timeout, 3)

    @override_settings(COLLECTION_MAX_DETAILS=1)
    def test_detail_link_limit_is_configurable(self):
        parser = PageParser(); parser.links = ['/eventos/first/', '/eventos/second/']
        self.assertEqual(detail_links(parser, 'https://gpul.org/'), ['https://gpul.org/eventos/first/'])

@override_settings(COLLECTION_ENABLED=True, MANAGED_SOURCE_IDS={'test'})
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

    @override_settings(COLLECTION_WEEKDAYS=[1,4], COLLECTION_INTERVAL_HOURS=48)
    def test_scheduler_uses_configured_weekdays_and_minimum_interval(self):
        tuesday = datetime(2026,10,20,10,tzinfo=dt_timezone.utc)
        with patch('core.tasks.processing_config', return_value={'retrieval':'twice-weekly'}), patch('core.tasks.enqueue_source') as enqueue:
            with patch('core.tasks.timezone.now', return_value=tuesday-timedelta(days=1)):
                schedule_sources()
            enqueue.assert_not_called()
            run = CollectionRun.objects.create(source=self.source, status='completed')
            CollectionRun.objects.filter(pk=run.pk).update(created_at=tuesday-timedelta(hours=47))
            with patch('core.tasks.timezone.now', return_value=tuesday):
                schedule_sources()
            enqueue.assert_not_called()
            CollectionRun.objects.filter(pk=run.pk).update(created_at=tuesday-timedelta(hours=49))
            with patch('core.tasks.timezone.now', return_value=tuesday):
                schedule_sources()
            enqueue.assert_called_once_with(self.source.id)
