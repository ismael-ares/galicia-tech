"""Fixtures sintéticas pequeñas; no representan datos ni páginas reales capturadas."""
import datetime as dt
import json
import tempfile
import unittest
from unittest.mock import patch
import eventos_galicia as app

FIXTURE_EVENT = '''<script type="application/ld+json">{"@context":"https://schema.org","@type":"Event","name":"Taller de prueba","startDate":"2026-10-21T16:00:00Z","endDate":"2026-10-21T17:00:00Z","url":"https://example.invalid/event?source=one","location":{"@type":"Place","name":"Aula","address":{"addressLocality":"Ourense"}},"offers":{"@type":"Offer","price":0,"url":"https://example.invalid/event"}}</script>'''

def event(id='a', **values):
    base={'id':id,'community':'GDG Ourense','name':'Evento','start':'2026-10-21T18:00:00+02:00','end':'2026-10-21T20:00:00+02:00','location':'Aula, Ourense','source_url':'https://example.invalid/'+id,'source_urls':['https://example.invalid/'+id],'source_refs':[{'community':'GDG Ourense','url':'https://example.invalid/'+id}], 'price':None,'registration_url':None,'status':'https://schema.org/EventScheduled'}
    base.update(values);return base

class CollectorTests(unittest.TestCase):
    def test_extracts_jsonld_converts_timezone_and_does_not_invent_price(self):
        node=list(app.events_in(app.jsonlds(FIXTURE_EVENT)[0]))[0]
        parsed=app.normalize_event(node,'Comunidad prueba','https://example.invalid/event','2026-10-19T12:00:00+00:00')
        self.assertEqual(parsed['start'],'2026-10-21T18:00:00+02:00')
        self.assertEqual(parsed['price'],'Gratis')
        self.assertEqual(parsed['location'],'Aula, Ourense')
        self.assertTrue(parsed['source_url'].endswith('/event'))
        self.assertIsNone(app.normalize_event({**node,'offers':None},'C','https://example.invalid','t')['price'])

    def test_access_restriction_is_visible_but_does_not_force_review_and_past_excludes_event(self):
        item=event(requirements=['Solo estudiantes USC'])
        app.classify(item,dt.date(2026,10,19));self.assertEqual(item['classification'],'publishable')
        self.assertEqual(item['requirements'],['Solo estudiantes USC'])
        app.classify(item,dt.date(2026,10,22));self.assertEqual(item['classification'],'past')

    def test_explicit_cancellation_and_registration_mismatch_override_publishable(self):
        cancelled=event(status='https://schema.org/EventCancelled')
        app.classify(cancelled,dt.date(2026,10,19));self.assertEqual(cancelled['classification'],'cancelled')
        mismatch=event(registration_state='invalid_mismatch',review_reasons=['El registro apunta a otro evento'])
        app.classify(mismatch,dt.date(2026,10,19));self.assertEqual(mismatch['classification'],'requires_review')
        self.assertEqual(mismatch['review_reasons'],['El registro apunta a otro evento'])
        uncertain=event(possible_duplicate=True,review_reasons=['Posible duplicado'])
        app.classify(uncertain,dt.date(2026,10,19));self.assertEqual(uncertain['classification'],'requires_review')

    def test_dedup_canonical_url_and_uncertain_duplicate_review(self):
        a=event('a',source_url='https://example.invalid/e?utm_source=x',source_urls=['https://example.invalid/e?utm_source=x'],source_refs=[{'community':'GDG A','url':'https://example.invalid/e?utm_source=x'}])
        b=event('b',community='GDG B',source_url='https://example.invalid/e#fragment',source_urls=['https://example.invalid/e#fragment'],source_refs=[{'community':'GDG B','url':'https://example.invalid/e#fragment'}])
        rows=app.deduplicate([a,b]);self.assertEqual(len(rows),1);self.assertEqual(len(rows[0]['sources']),2)
        c=event('c',name='Otro lugar',start='2026-10-21T18:45:00+02:00')
        d=event('d',name='Otro lugar',start='2026-10-21T19:00:00+02:00',location='Lugar distinto')
        rows=app.deduplicate([c,d]);self.assertEqual(len(rows),2);self.assertTrue(rows[0]['possible_duplicate'])

    def test_reconcile_persists_not_observed_across_three_runs_and_preserves_failures(self):
        original=event('missing')
        first={'events':[original],'sources':{'GDG Ourense':{'status':'ok'}},'failed_sources':[]}
        second={'events':[],'sources':{'GDG Ourense':{'status':'ok'}},'failed_sources':[]}
        app.reconcile(second,first,dt.date(2026,10,19))
        self.assertEqual(second['events'][0]['retention_state'],'not_observed')
        third={'events':[],'sources':{'GDG Ourense':{'status':'ok'}},'failed_sources':[]}
        app.reconcile(third,second,dt.date(2026,10,19))
        self.assertEqual(third['events'][0]['retention_state'],'not_observed')
        failed={'events':[],'sources':{'GDG Ourense':{'status':'failed'}},'failed_sources':['GDG Ourense']}
        app.reconcile(failed,third,dt.date(2026,10,19))
        self.assertEqual(failed['events'][0]['retention_state'],'preserved_due_fetch_failure')
        partial={'events':[],'sources':{'GDG Ourense':{'status':'partial','detail_errors':[{'url':original['source_url'],'error':'timeout'}]}},'failed_sources':[]}
        app.reconcile(partial,first,dt.date(2026,10,19))
        self.assertEqual(partial['events'][0]['retention_state'],'preserved_due_partial_read')

    def test_change_report_contains_before_and_after_for_time_and_registration(self):
        before=event(registration_url='https://example.invalid/register-old')
        after=event(registration_url='https://example.invalid/register-new',start='2026-10-21T19:00:00+02:00')
        current={'events':[after],'sources':{},'failed_sources':[]}
        compared=app.compare(current,{'events':[before]})[0]
        self.assertEqual(compared['change'],'cambios detectados')
        self.assertEqual(compared['change_details']['start'],(before['start'],after['start']))
        self.assertEqual(compared['change_details']['registration_url'],(before['registration_url'],after['registration_url']))

    def test_replay_is_separate_and_does_not_modify_latest(self):
        with tempfile.TemporaryDirectory() as temp:
            root=__import__('pathlib').Path(temp);real=root/'real';real.mkdir()
            snapshot={'version':1,'as_of':'2026-10-19','timezone':'Europe/Madrid','captured_at':'2026-10-19T10:00:00Z','sources':{},'failed_sources':[],'events':[event()]}
            latest=real/'latest.json';latest.write_text(json.dumps(snapshot),encoding='utf8');before=latest.read_bytes()
            app.run(dt.date(2026,10,19),root,reuse=True)
            self.assertEqual(latest.read_bytes(),before)
            reports=list((root/'replay').glob('report-*.md'))
            self.assertEqual(len(reports),1)
            self.assertIn('REPRODUCCIÓN',reports[0].read_text(encoding='utf8'))

    def test_known_missing_future_detail_is_refreshed_and_explicit_cancel_is_reported(self):
        old=event('gone',source_url='https://example.invalid/event',source_urls=['https://example.invalid/event'],
                  source_refs=[{'community':'GDG Ourense','url':'https://example.invalid/event'}])
        current={'events':[],'sources':{'GDG Ourense':{'status':'ok','detail_errors':[]}},'failed_sources':[]}
        body=FIXTURE_EVENT.replace('"url":"https://example.invalid/event?source=one"','"url":"https://example.invalid/event"').replace('"name":"Taller de prueba"','"name":"Evento"').replace('"endDate":"2026-10-21T17:00:00Z"','"endDate":"2026-10-21T17:00:00Z","eventStatus":"https://schema.org/EventCancelled"')
        with patch.object(app,'fetch',return_value=(body,'https://example.invalid/event')):
            app.refresh_absent(current,{'events':[old]},'2026-10-19T12:00:00+00:00',dt.date(2026,10,19))
        self.assertEqual(len(current['events']),1)
        app.classify(current['events'][0],dt.date(2026,10,19))
        self.assertEqual(current['events'][0]['classification'],'cancelled')
        self.assertEqual(current['events'][0]['observation_state'],'not_in_listing_detail_refreshed')

if __name__=='__main__':unittest.main()
