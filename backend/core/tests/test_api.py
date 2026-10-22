from copy import deepcopy
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
import json
from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from redis import RedisError
from core.models import AuditLog, Event, Favorite, ProcessingConfig, ReviewCase, Source, User
from core.services import processing_config

@override_settings(REQUIRE_ADMIN_MFA=False)
class ApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('import_sample')
        cls.owner = User.objects.create_user('owner', email='owner@example.org', password='a-long-test-password', is_staff=True)
        cls.other = User.objects.create_user('reader', email='reader@example.org', password='a-long-test-password')
    def setUp(self):
        self.client = APIClient()
    def admin(self):
        self.client.force_login(self.owner)
    def test_public_catalog_has_no_reviews_or_private_user_data(self):
        data = self.client.get('/api/v1/catalog/').json()
        self.assertEqual(len(data['events']), 8)
        self.assertEqual(len(data['sources']), 13)
        self.assertNotIn('reviews', data)
        self.assertTrue(data['sample'])
        self.assertIn('Extreme AI engineering', data['translations'])
    def test_sample_translations_match_exact_original_texts(self):
        translations = json.loads((Path(settings.BASE_DIR)/'sample'/'events-gl.json').read_text())
        for event in Event.objects.all():
            texts = [event.base_data['title'], *event.base_data['description'], event.base_data['requirements']]
            for text in texts:
                if text in translations:
                    self.assertEqual(event.translations[text], translations[text])

    def test_roles_cannot_be_forged_in_request(self):
        for url in ('/api/v1/admin/sources/', '/api/v1/admin/reviews/', '/api/v1/admin/configuration/'):
            self.assertEqual(self.client.get(url, HTTP_COOKIE='role=admin').status_code, 401)
        self.client.force_login(self.other)
        self.assertEqual(self.client.patch('/api/v1/admin/sources/ourense/', {'enabled': False}, format='json').status_code, 403)
        self.assertTrue(Source.objects.get(pk='ourense').enabled)
    @override_settings(REQUIRE_ADMIN_MFA=True)
    def test_admin_without_totp_must_enroll(self):
        self.admin()
        self.assertEqual(self.client.get('/api/v1/admin/sources/').status_code, 403)
        self.assertEqual(self.client.get('/api/v1/session/').status_code, 200)
    def test_favorites_are_idempotent_and_private(self):
        self.client.force_login(self.other)
        self.assertEqual(self.client.put('/api/v1/favorites/santiago/').status_code, 204)
        self.client.put('/api/v1/favorites/santiago/')
        self.assertEqual(Favorite.objects.count(), 1)
        self.assertEqual(self.client.get('/api/v1/session/').json()['favorites'], ['santiago'])
        self.admin()
        self.assertEqual(self.client.get('/api/v1/session/').json()['favorites'], [])
        self.client.force_login(self.other)
        self.client.delete('/api/v1/favorites/santiago/')
        self.assertFalse(Favorite.objects.exists())
    def test_review_patches_server_data_and_rejects_stale_writes(self):
        self.admin()
        case = ReviewCase.objects.get(pk='end-time')
        url = '/api/v1/admin/reviews/end-time/'
        result = self.client.patch(url, {'status': 'approved', 'value': '19:00', 'version': case.version}, format='json')
        self.assertEqual(result.status_code, 200)
        self.assertEqual(Event.objects.get(pk='hackathon').data['end'], '2026-10-22T19:00:00+02:00')
        self.assertEqual(self.client.patch(url, {'status':'approved','value':'19:30','version':case.version}, format='json').status_code, 409)
        self.assertEqual(self.client.patch(url, {'status':'approved','value':'invented','version':case.version+1}, format='json').status_code, 400)
        self.assertEqual(AuditLog.objects.filter(action='review.approved').count(), 1)
    def test_unpublished_review_and_unsafe_registration(self):
        self.admin()
        case = ReviewCase.objects.get(pk='registration')
        result = self.client.patch('/api/v1/admin/reviews/registration/', {'status':'pending','version':case.version}, format='json')
        self.assertEqual(result.status_code, 200)
        self.assertFalse(Event.objects.get(pk='hacktoberfest').published)
        for value in ('javascript:alert(1)', 'https://user:secret@example.org/'):
            self.assertEqual(self.client.patch('/api/v1/admin/reviews/registration/', {'status':'approved','version':case.version+1,'value':value}, format='json').status_code, 400)
    def test_pausing_a_source_preserves_published_events(self):
        self.admin()
        response = self.client.patch('/api/v1/admin/sources/ourense/', {'enabled': False}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.client.get('/api/v1/catalog/').json()['events']), 8)
    def test_sample_import_does_not_reset_reviews_or_sources(self):
        self.admin()
        case = ReviewCase.objects.get(pk='end-time')
        self.client.patch('/api/v1/admin/reviews/end-time/', {'status':'approved','value':'19:00','version':case.version}, format='json')
        Source.objects.filter(pk='ourense').update(enabled=False)
        call_command('import_sample')
        self.assertEqual(Event.objects.count(), 9)
        self.assertFalse(Source.objects.get(pk='ourense').enabled)
        self.assertEqual(Event.objects.get(pk='hackathon').data['end'], '2026-10-22T19:00:00+02:00')
    def test_configuration_budget_and_optimistic_concurrency(self):
        self.admin()
        values = self.client.get('/api/v1/admin/configuration/').json()
        values.update(budget='1.50')
        self.assertEqual(self.client.put('/api/v1/admin/configuration/', values, format='json').status_code, 200)
        self.assertEqual(self.client.put('/api/v1/admin/configuration/', values, format='json').status_code, 409)
        values.update(version=values['version']+1, budget='50')
        self.assertEqual(self.client.put('/api/v1/admin/configuration/', values, format='json').status_code, 400)
        self.assertFalse(self.client.get('/api/v1/admin/configuration/').json()['paidCallsEnabled'])
    def test_yaml_lock_and_invalid_reload_keep_last_valid_config(self):
        self.admin()
        with TemporaryDirectory() as directory:
            path = Path(directory)/'processing.yaml'
            path.write_text('processing:\n  retrieval: daily\n  frequency: twice-weekly\n  budget_eur: 1.25\n')
            with override_settings(CONFIG_AUTHORITY='yaml', CONFIG_YAML_PATH=str(path)):
                self.assertEqual(processing_config()['budget'], '1.25')
                self.assertEqual(self.client.put('/api/v1/admin/configuration/', {}, format='json').status_code, 403)
                path.write_text('processing: invalid')
                self.assertIn('warning', processing_config())
                self.assertEqual(ProcessingConfig.objects.get(pk=1).budget, Decimal('1.25'))
    def test_collection_disabled_does_not_enqueue(self):
        self.admin()
        with override_settings(COLLECTION_ENABLED=False):
            self.assertEqual(self.client.post('/api/v1/admin/collections/', {'sourceId':'ourense'}, format='json').status_code, 409)

    def test_last_approved_review_wins_and_cancelled_event_requires_discard(self):
        self.admin()
        event = Event.objects.get(pk='santiago')
        older = ReviewCase.objects.create(id='z-older', event=event, data={
            'published': True, 'field': {'kind': 'confirmation'}, 'approvedPatch': {'title': 'Older verified title'}}, status='approved', value='confirmed')
        newer = ReviewCase.objects.create(id='a-newer', event=event, data={
            'published': True, 'field': {'kind': 'confirmation'}, 'approvedPatch': {'title': 'Newer verified title'}}, status='pending')
        response = self.client.patch('/api/v1/admin/reviews/a-newer/', {'status':'approved','value':'confirmed','version':1}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Event.objects.get(pk='santiago').title, 'Newer verified title')
        cancellation = ReviewCase.objects.create(id='cancelled-source', event=event, data={
            'published': True, 'cancelled': True, 'field': {'kind': 'confirmation'}})
        response = self.client.patch('/api/v1/admin/reviews/cancelled-source/', {'status':'approved','value':'confirmed','version':1}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertTrue(Event.objects.get(pk='santiago').published)
        self.assertEqual(self.client.patch('/api/v1/admin/reviews/cancelled-source/', {'status':'discarded','version':1}, format='json').status_code, 200)
        self.assertFalse(Event.objects.get(pk='santiago').published)

class AuthSecurityTests(TestCase):
    def test_unsafe_auth_without_csrf_rejected(self):
        client = APIClient(enforce_csrf_checks=True)
        with patch('core.middleware.redis.eval', return_value=1):
            self.assertEqual(client.post('/_allauth/browser/v1/auth/login', {'email':'x@example.org','password':'secret'}, format='json').status_code, 403)
    def test_auth_fails_closed_when_redis_unavailable(self):
        with patch('core.middleware.redis.eval', side_effect=RedisError('unavailable')):
            response = self.client.post('/_allauth/browser/v1/auth/login', data=json.dumps({'email':'x@example.org','password':'secret'}), content_type='application/json')
        self.assertEqual(response.status_code, 503)
    def test_public_signup_disabled(self):
        with patch('core.middleware.redis.eval', return_value=1):
            response = self.client.post('/_allauth/browser/v1/auth/signup', data=json.dumps({'email':'new@example.org','password':'long-enough-password'}), content_type='application/json')
        self.assertNotIn(response.status_code, (200, 201))
        self.assertFalse(User.objects.filter(email='new@example.org').exists())
    def test_no_cache_for_private_responses(self):
        response = self.client.get('/api/v1/session/')
        self.assertEqual(response['Cache-Control'], 'no-store')
        self.assertNotIn('session', response.json())

class MFAFlowTests(TestCase):
    def test_password_login_enrollment_reauth_and_totp_challenge(self):
        from allauth.account.models import EmailAddress
        from allauth.mfa.totp.internal.auth import hotp_value
        import time
        user = User.objects.create_user('mfa-owner', email='mfa@example.org', password='a-long-test-password', is_staff=True)
        EmailAddress.objects.create(user=user, email=user.email, primary=True, verified=True)
        client = APIClient()
        with patch('core.middleware.redis.eval', return_value=1):
            response = client.post('/_allauth/browser/v1/auth/login', {'email':user.email,'password':'a-long-test-password'}, format='json')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(client.get('/api/v1/admin/sources/').status_code, 403)
            response = client.get('/_allauth/browser/v1/account/authenticators/totp')
            self.assertEqual(response.status_code, 404)
            secret = response.json()['meta']['secret']
            code = str(hotp_value(secret, int(time.time())//30)).zfill(6)
            self.assertEqual(client.post('/_allauth/browser/v1/account/authenticators/totp', {'code':code}, format='json').status_code, 401)
            self.assertEqual(client.post('/_allauth/browser/v1/auth/reauthenticate', {'password':'a-long-test-password'}, format='json').status_code, 200)
            self.assertEqual(client.post('/_allauth/browser/v1/account/authenticators/totp', {'code':code}, format='json').status_code, 200)
            from allauth.mfa.models import Authenticator
            saved = Authenticator.objects.get(user=user, type='totp')
            self.assertNotIn(secret, json.dumps(saved.data))
            self.assertEqual(client.get('/api/v1/admin/sources/').status_code, 200)
            client.delete('/_allauth/browser/v1/auth/session')
            response = client.post('/_allauth/browser/v1/auth/login', {'email':user.email,'password':'a-long-test-password'}, format='json')
            self.assertEqual(response.status_code, 401)
            self.assertEqual(client.get('/api/v1/admin/sources/').status_code, 401)
            self.assertEqual(client.post('/_allauth/browser/v1/auth/2fa/authenticate', {'code':code}, format='json').status_code, 200)
            self.assertEqual(client.get('/api/v1/admin/sources/').status_code, 200)
