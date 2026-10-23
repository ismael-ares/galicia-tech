import json
from unittest.mock import patch
from django.core.management import call_command, CommandError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from core.models import User

@override_settings(LOCAL_TEST_ACCOUNTS=True, ACCOUNT_LOGIN_METHODS={'email', 'username'}, REQUIRE_ADMIN_MFA=False,
                   CACHES={'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}})
class LocalAccountsTests(TestCase):
    @override_settings(LOCAL_TEST_ACCOUNTS=False)
    def test_fixtures_are_disabled_by_default(self):
        with self.assertRaises(CommandError):
            call_command('seed_local_users')
        self.assertFalse(User.objects.exists())

    def test_command_reuses_local_accounts_and_preserves_other_users(self):
        existing = User.objects.create_user('other', email='other@example.org', password='untouched-password')
        old_admin = User.objects.create_user('admin@galicia-tech.test', email='admin@galicia-tech.test', password='previous-password', is_staff=True)
        call_command('seed_local_users')
        old_admin.refresh_from_db()
        self.assertEqual(old_admin.username, 'admin')
        self.assertEqual(old_admin.first_name, 'admin')
        self.assertTrue(old_admin.check_password('admin'))
        ids = list(User.objects.order_by('id').values_list('id', flat=True))
        call_command('seed_local_users')
        self.assertEqual(list(User.objects.order_by('id').values_list('id', flat=True)), ids)
        existing.refresh_from_db()
        self.assertTrue(existing.check_password('untouched-password'))

    def test_local_names_authenticate_with_separate_permissions(self):
        call_command('seed_local_users')
        with patch('core.middleware.redis.eval', return_value=1):
            for name, role, expected in [('admin', 'admin', 200), ('user', 'user', 403)]:
                client = APIClient(enforce_csrf_checks=True)
                token = client.get('/api/v1/session/').json()['csrfToken']
                response = client.post('/_allauth/browser/v1/auth/login',
                                       {'username': name, 'password': name}, format='json', HTTP_X_CSRFTOKEN=token)
                self.assertEqual(response.status_code, 200, response.content)
                self.assertEqual(client.get('/api/v1/session/').json()['user']['role'], role)
                self.assertEqual(client.get('/api/v1/admin/sources/').status_code, expected)

    def test_existing_username_is_not_overwritten(self):
        user = User.objects.create_user('user', email='different@example.org', password='untouched-password')
        with self.assertRaises(CommandError):
            call_command('seed_local_users')
        user.refresh_from_db()
        self.assertTrue(user.check_password('untouched-password'))
        self.assertFalse(User.objects.filter(email='admin@galicia-tech.test').exists())
