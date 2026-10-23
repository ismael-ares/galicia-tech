import json
from unittest.mock import patch
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from core.models import User

@override_settings(ALLOW_REGISTRATION=True, CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class RegistrationTests(TestCase):
    def setUp(self):
        limiter = patch('core.middleware.redis.eval', return_value=1)
        limiter.start()
        self.addCleanup(limiter.stop)
        self.client = APIClient(enforce_csrf_checks=True)
        self.token = self.client.get('/api/v1/session/').json()['csrfToken']

    def signup(self, email='new-reader@example.org', password='Alborada-costa-2026!', **extra):
        return self.client.post('/_allauth/browser/v1/auth/signup',
                                data=json.dumps({'email': email, 'password': password, **extra}),
                                content_type='application/json', HTTP_X_CSRFTOKEN=self.token)

    def test_signup_creates_normal_session_and_never_grants_admin(self):
        response = self.signup(role='admin', is_staff=True, is_superuser=True)
        self.assertEqual(response.status_code, 200, response.content)
        user = User.objects.get(email='new-reader@example.org')
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password('Alborada-costa-2026!'))
        self.assertNotEqual(user.password, 'Alborada-costa-2026!')
        self.assertEqual(self.client.get('/api/v1/session/').json()['user']['role'], 'user')
        self.assertEqual(self.client.get('/api/v1/admin/sources/').status_code, 403)
        self.assertEqual(response.cookies['galicia_session']['httponly'], True)

    def test_weak_password_is_rejected(self):
        self.assertEqual(self.signup(password='short').status_code, 400)
        self.assertFalse(User.objects.exists())

    @override_settings(LOCAL_TEST_ACCOUNTS=True)
    def test_local_registration_cannot_opt_out_of_temporary_lifecycle(self):
        self.assertEqual(self.signup(is_ephemeral=False).status_code, 200)
        self.assertTrue(User.objects.get(email='new-reader@example.org').is_ephemeral)

    @override_settings(LOCAL_TEST_ACCOUNTS=False)
    def test_regular_registration_remains_persistent(self):
        self.assertEqual(self.signup(is_ephemeral=True).status_code, 200)
        self.assertFalse(User.objects.get(email='new-reader@example.org').is_ephemeral)

    def test_missing_csrf_is_rejected(self):
        response = self.client.post('/_allauth/browser/v1/auth/signup',
                                    {'email': 'new-reader@example.org', 'password': 'Alborada-costa-2026!'}, format='json')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(User.objects.exists())

    @override_settings(ALLOW_REGISTRATION=False)
    def test_closed_registration_is_enforced_by_server(self):
        self.assertFalse(self.client.get('/api/v1/session/').json()['registrationEnabled'])
        self.assertEqual(self.signup().status_code, 403)
        self.assertFalse(User.objects.exists())

    def test_registration_can_be_disabled_without_blocking_existing_login(self):
        self.assertTrue(self.client.get('/api/v1/session/').json()['registrationEnabled'])
        self.assertEqual(self.signup().status_code, 200)
        token = self.client.get('/api/v1/session/').json()['csrfToken']
        self.client.delete('/_allauth/browser/v1/auth/session', HTTP_X_CSRFTOKEN=token)
        token = self.client.get('/api/v1/session/').json()['csrfToken']
        with override_settings(ALLOW_REGISTRATION=False):
            response = self.client.post('/_allauth/browser/v1/auth/login',
                                        {'email': 'new-reader@example.org', 'password': 'Alborada-costa-2026!'},
                                        format='json', HTTP_X_CSRFTOKEN=token)
            self.assertEqual(response.status_code, 200)
