"""Fixtures HTML sintéticas para probar heurísticas; no son capturas de eventos reales."""
import importlib.util
import argparse
import json
import tempfile
from unittest.mock import patch
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "cover_discovery.py"
spec = importlib.util.spec_from_file_location("cover_discovery", MODULE_PATH)
cd = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cd)

EVENT = {"id": "demo", "title": "DevFest Ejemplo 2026", "year": "2026", "event_page": "https://events.example/e/1", "official_pages": ["https://official.example/", "https://official.example/agenda", "https://third.example/"]}


class DiscoveryTests(unittest.TestCase):
    def test_specific_event_image_outranks_generic_og(self):
        html = '''<title>DevFest Ejemplo 2026</title><meta property="og:image" content="/brand-logo.png">
        <script type="application/ld+json">{"@type":"Event","name":"DevFest Ejemplo 2026","image":{"contentUrl":"/event-cover.png"}}</script></html>'''
        parsed = cd.parse_page(html, EVENT["event_page"], EVENT, "event-page")
        self.assertEqual(parsed["candidates"][0]["url"], "https://events.example/event-cover.png")
        self.assertTrue(any(x["status"] == "brand-only" for x in parsed["rejected"]))

    def test_same_url_in_weak_og_does_not_hide_direct_event_image(self):
        html='''<meta property="og:image" content="/intro-terminal.png">
        <script type="application/ld+json">{"@graph":[{"@type":"Event","name":"Introdución á terminal","image":"/intro-terminal.png"}]}</script>'''
        event={**EVENT,'title':'Introdución á terminal'}
        parsed=cd.parse_page(html,EVENT['event_page'],event,'event-page')
        self.assertEqual(len(parsed['candidates']),1)
        self.assertEqual(parsed['candidates'][0]['kind'],'jsonld-event-image')
        self.assertEqual(parsed['rejected'],[])

    def test_page_title_alone_does_not_validate_og(self):
        html = '<title>DevFest Ejemplo 2026</title><meta property="og:image" content="/open-graph-image.png">'
        parsed = cd.parse_page(html, "https://official.example/", EVENT, "official-page")
        self.assertEqual(parsed["candidates"], [])
        self.assertEqual(parsed["rejected"][0]["status"], "brand-only")

    def test_event_jsonld_does_not_excuse_generic_image_filename(self):
        html = '''<title>DevFest Ejemplo 2026</title><script type="application/ld+json">
        {"@type":"Event","name":"DevFest Ejemplo 2026","image":"/open-graph-image.png"}</script>'''
        parsed = cd.parse_page(html, EVENT["event_page"], EVENT, "event-page")
        self.assertEqual(parsed["candidates"], [])
        self.assertIn("nombre genérico", parsed["rejected"][0]["reason"])

    def test_embedded_event_title_does_not_turn_default_thumbnail_into_poster(self):
        payload = {"event": {"name": "DevFest Ejemplo 2026", "thumbnail": "/GDG_Bevy_DefaultEventThumbnail_2.png"}}
        parsed = cd.parse_page(
            '<script id="__NEXT_DATA__" type="application/json">' + __import__("json").dumps(payload) + "</script>",
            EVENT["event_page"], EVENT, "event-page")
        self.assertEqual(parsed["candidates"], [])
        self.assertTrue(any(item["status"] == "brand-only" and "genérico" in item["reason"] for item in parsed["rejected"]))

    def test_relative_twitter_image_keeps_query_and_is_uncertain(self):
        html = '<title>DevFest Ejemplo 2026</title><meta name="twitter:image" content="../cover.jpg?sig=x&amp;size=2#image">'
        parsed = cd.parse_page(html, "https://official.example/path/page", EVENT, "official-page")
        self.assertEqual(parsed["rejected"][0]["url"], "https://official.example/cover.jpg?sig=x&size=2")
        self.assertEqual(parsed["rejected"][0]["status"], "uncertain")

    def test_avatar_logo_and_wrong_year_are_rejected_but_specific_poster_is_kept(self):
        html = '''<title>DevFest Ejemplo 2026</title><img src="/speaker-avatar-2026.png" alt="DevFest Ejemplo 2026 speaker avatar">
        <img src="/cover-2025.jpg" alt="DevFest Ejemplo 2026"/><img src="/cover-2026.jpg" alt="DevFest Ejemplo 2026 poster"/>'''
        parsed = cd.parse_page(html, EVENT["event_page"], EVENT, "event-page")
        self.assertEqual([x["url"] for x in parsed["candidates"]], ["https://events.example/cover-2026.jpg"])
        self.assertEqual(len(parsed["rejected"]), 2)

    def test_srcset_and_inline_background_are_scanned_for_specific_context(self):
        html = '''<figure><img src="/small.jpg" srcset="/small.jpg 400w, /large.jpg 1200w" alt="DevFest Ejemplo 2026 poster"><figcaption>DevFest Ejemplo 2026 poster</figcaption></figure>
        <div class="event-cover" style="background-image:url('/banner.jpg')" title="DevFest Ejemplo 2026 event banner"></div>'''
        parsed = cd.parse_page(html, "https://official.example/", EVENT, "official-page")
        urls = {x["url"] for x in parsed["candidates"]}
        self.assertIn("https://official.example/large.jpg", urls)
        self.assertIn("https://official.example/banner.jpg", urls)

    def test_repeated_generic_og_and_reviewed_previous_cover_degrade_to_fallback(self):
        calls = []
        pages = {
            EVENT["event_page"]: '<title>DevFest Ejemplo 2026</title><meta property="og:image" content="https://official.example/open-graph-image.png">',
            "https://official.example/": '<title>DevFest Ejemplo 2026</title><meta property="og:image" content="https://official.example/open-graph-image.png">',
            "https://official.example/agenda": '<title>Agenda</title>'
        }
        def fetch(url):
            calls.append(url); return pages[url], url
        previous = {"title": "DevFest Ejemplo 2026", "selected": {"url": "https://official.example/open-graph-image.png", "evidenceType": "og:image"}}
        review = {"rejected": [{"url": "https://official.example/open-graph-image.png", "sha256": "abc", "reason": "Inspección visual: marca genérica."}]}
        result = cd.discover_event(EVENT, previous, fetch, lambda _: {"ok": True}, review)
        self.assertIsNone(result["selected"])
        self.assertEqual(result["status"], "no-image")
        self.assertTrue(any("Inspección visual" in x["reason"] for x in result["rejected"]))
        self.assertTrue(any("repite" in x["reason"] or "repetida" in x["reason"] for x in result["rejected"]))

    def test_reviewed_meetup_logo_cannot_return_via_another_cdn_crop(self):
        event={**EVENT,'official_pages':[]}
        alias='https://secure.meetupstatic.com/photos/event/a/b/c/event_123456.jpeg?w=1080'
        body='''<script type="application/ld+json">{"@type":"Event","name":"DevFest Ejemplo 2026","image":"'''+alias+'''"}</script>'''
        review={'rejectedAssets':[{'provider':'meetup','id':'123456','reason':'Logo revisado'}]}
        previous={'selected':{'url':'https://secure-content.meetupstatic.com/images/classic-events/123456/676x380.jpg','specificity':'specific'}}
        def unexpected_check(url):raise AssertionError('No debe comprobar una imagen ya descartada')
        result=cd.discover_event(event,previous,lambda url:(body,url),unexpected_check,review)
        self.assertIsNone(result['selected'])
        self.assertEqual(result['candidates_checked'],[])
        self.assertTrue(any('Logo revisado' in item['reason'] for item in result['rejected']))
        self.assertIsNone(cd._review_rejection('https://secure-content.meetupstatic.com/images/classic-events/999999/676x380.jpg',review))

    def test_failed_refresh_retains_only_previous_specific_cover(self):
        def fail(url): raise TimeoutError("source down")
        event = {**EVENT, "official_pages": []}
        good = {"title": EVENT["title"], "selected": {"url": "https://img.example/blob-event.png", "evidenceType": "jsonld-event-image"}}
        retained = cd.discover_event(event, good, fail, lambda _: {"ok": False})
        self.assertEqual(retained["status"], "retained")
        self.assertEqual(retained["selected"]["url"], good["selected"]["url"])
        generic = {"title": EVENT["title"], "selected": {"url": "https://official.example/open-graph-image.png", "evidenceType": "og:image"}}
        invalidated = cd.discover_event(event, generic, fail, lambda _: {"ok": False})
        self.assertIsNone(invalidated["selected"])
        self.assertEqual(len(retained["errors"]), 1)

    def test_official_link_follow_is_capped_at_two_and_specific_image_selected(self):
        calls = []
        pages = {
            EVENT["event_page"]: '<title>DevFest Ejemplo 2026</title>',
            "https://official.example/": '<title>DevFest Ejemplo 2026</title><meta property="og:image" content="/generic.png"><img src="/poster.jpg" alt="DevFest Ejemplo 2026 poster">',
            "https://official.example/agenda": '<title>Agenda</title><img src="/another.jpg" alt="DevFest Ejemplo 2026 event poster">',
        }
        def fetch(url): calls.append(url); return pages[url], url
        def check(url): return {"ok": True, "content_type": "image/jpeg", "width": 800, "height": 600, "final_url": url, "sha256": "abc", "sha256_scope": "full"}
        result = cd.discover_event(EVENT, None, fetch, check)
        self.assertEqual(len(calls), 3)
        self.assertNotIn("https://third.example/", calls)
        self.assertEqual(result["selected"]["url"], "https://official.example/poster.jpg")
        self.assertEqual(result["selected"]["specificity"], "specific")

    def test_manifest_refresh_includes_sources_beyond_the_original_four(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            source=root/'sources.json'
            events=[{**EVENT,'id':f'event-{index}'} for index in range(6)]
            source.write_text(json.dumps({'events':events}),encoding='utf8')
            args=argparse.Namespace(input=source,review=root/'review.json',manifest=root/'manifest.json',javascript=root/'manifest.js',reports=root/'reports',as_of='2026-10-20')
            def discover(event,*args,**kwargs):
                return {'id':event['id'],'title':event['title'],'status':'no-image','selected':None,'errors':[],'rejected':[]}
            with patch.object(cd,'ROOT',root),patch.object(cd,'discover_event',side_effect=discover):
                cd.run(args)
            saved=json.loads(args.manifest.read_text())
            self.assertEqual(len(saved['events']),6)
            self.assertIn('event-5',args.javascript.read_text())

    def test_png_dimensions_and_manifest_fallback_entry(self):
        data = bytearray(24); data[:8] = b"\x89PNG\r\n\x1a\n"
        data[16:24] = (900).to_bytes(4, "big") + (500).to_bytes(4, "big")
        self.assertEqual(cd.image_dimensions(bytes(data), "image/png"), (900, 500))
        js = cd.manifest_js({"events": [{"id": "demo", "status": "no-image", "selected": None}]})
        self.assertIn('"url":null', js); self.assertIn('"status":"no-image"', js)


if __name__ == "__main__": unittest.main()
