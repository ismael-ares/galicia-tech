from datetime import timedelta
from io import StringIO
from django.contrib.sessions.backends.db import SessionStore
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.utils import timezone
from allauth.account.models import EmailAddress
from core.models import Event, Favorite, Source, User

@override_settings(LOCAL_TEST_ACCOUNTS=True)
class TemporaryAccountTests(TestCase):
    def prepare(self):
        call_command('prepare_local_environment', stdout=StringIO())

    def test_reset_removes_only_temporary_accounts_and_related_data(self):
        permanent = User.objects.create_user('permanent', email='permanent@example.org', password='long-persistent-password')
        temporary = User.objects.create_user('temporary', email='temporary@example.org', password='long-temporary-password', is_ephemeral=True)
        EmailAddress.objects.create(user=temporary, email=temporary.email, primary=True, verified=True)
        event = Event.objects.create(id='preserved', canonical_url='https://example.org/event', title='Preserved event', start=timezone.now(), city='A Coruña', community='Community')
        source = Source.objects.create(id='preserved', name='Preserved source', url='https://example.org', city='A Coruña', platform='Web')
        Favorite.objects.create(user=temporary, event=event)
        Favorite.objects.create(user=permanent, event=event)
        for user, key in [(temporary, 'temporary-session'), (permanent, 'permanent-session')]:
            Session.objects.create(session_key=key, session_data=SessionStore().encode({'_auth_user_id': str(user.pk)}), expire_date=timezone.now()+timedelta(days=1))
        self.prepare()
        self.assertFalse(User.objects.filter(pk=temporary.pk).exists())
        self.assertFalse(EmailAddress.objects.filter(email=temporary.email).exists())
        self.assertFalse(Session.objects.filter(session_key='temporary-session').exists())
        self.assertTrue(Session.objects.filter(session_key='permanent-session').exists())
        self.assertTrue(User.objects.filter(pk=permanent.pk).exists())
        self.assertEqual(Favorite.objects.count(), 1)
        self.assertTrue(Event.objects.filter(pk=event.pk).exists())
        self.assertTrue(Source.objects.filter(pk=source.pk).exists())

    def test_fixed_users_keep_ids_credentials_and_session_hashes(self):
        self.prepare()
        before = list(User.objects.order_by('username').values_list('pk', 'username', 'password'))
        User.objects.filter(username='user').update(is_ephemeral=True)
        self.prepare()
        self.assertEqual(list(User.objects.order_by('username').values_list('pk', 'username', 'password')), before)
        self.assertFalse(User.objects.filter(is_ephemeral=True).exists())
        self.assertTrue(User.objects.get(username='admin').is_staff)
        self.assertFalse(User.objects.get(username='user').is_staff)

    @override_settings(LOCAL_TEST_ACCOUNTS=False)
    def test_reset_is_inert_outside_local_profile(self):
        user = User.objects.create_user('kept', email='kept@example.org', is_ephemeral=True)
        self.prepare()
        self.assertEqual(list(User.objects.values_list('pk', flat=True)), [user.pk])

    def test_next_start_also_removes_accounts_created_after_first_reset(self):
        self.prepare()
        user = User.objects.create_user('temporary', email='temporary@example.org', is_ephemeral=True)
        self.assertTrue(User.objects.filter(pk=user.pk).exists())
        self.prepare()
        self.assertFalse(User.objects.filter(pk=user.pk).exists())
        self.assertEqual(User.objects.count(), 2)
