from datetime import timedelta
from unittest.mock import patch
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from core.models import Attendance, Event, Favorite, User


class AttendanceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reader = User.objects.create_user('reader', email='reader@example.org')
        cls.other = User.objects.create_user('other', email='other@example.org')
        cls.past = Event.objects.create(id='past', title='Past', canonical_url='https://example.org/past',
            start=timezone.now()-timedelta(days=2), city='A Coruña', community='Community', published=True)
        cls.future = Event.objects.create(id='future', title='Future', canonical_url='https://example.org/future',
            start=timezone.now()+timedelta(days=2), city='Lugo', community='Community', published=True)

        for event in [cls.past, cls.future]:
            event.data = {'id': event.pk, 'start': event.start.isoformat()}
            event.save(update_fields=['data'])

    def setUp(self):
        self.client = APIClient()
        self.client.force_login(self.reader)

    def test_requires_authentication_and_csrf(self):
        guest = APIClient()
        self.assertEqual(guest.put('/api/v1/attendance/past/').status_code, 401)
        self.assertEqual(guest.get('/api/v1/session/').json()['attended'], [])
        guarded = APIClient(enforce_csrf_checks=True)
        guarded.force_login(self.reader)
        self.assertEqual(guarded.put('/api/v1/attendance/past/').status_code, 403)
        self.assertFalse(Attendance.objects.exists())

    def test_mark_and_unmark_are_idempotent(self):
        for _ in range(2):
            self.assertEqual(self.client.put('/api/v1/attendance/past/').status_code, 204)
        self.assertEqual(Attendance.objects.count(), 1)
        self.assertEqual(self.client.get('/api/v1/session/').json()['attended'], ['past'])
        for _ in range(2):
            self.assertEqual(self.client.delete('/api/v1/attendance/past/').status_code, 204)
        self.assertFalse(Attendance.objects.exists())

    def test_attendance_is_private_and_user_cannot_be_selected_by_input(self):
        self.client.put('/api/v1/attendance/past/', {'user': self.other.pk}, format='json')
        self.assertEqual(Attendance.objects.get().user, self.reader)
        self.client.force_login(self.other)
        self.assertEqual(self.client.get('/api/v1/session/').json()['attended'], [])
        self.client.delete('/api/v1/attendance/past/')
        self.assertTrue(Attendance.objects.filter(user=self.reader).exists())
        self.assertNotIn('attended', self.client.get('/api/v1/catalog/').json())

    def test_future_events_cannot_be_marked(self):
        self.assertEqual(self.client.put('/api/v1/attendance/future/').status_code, 400)
        self.assertFalse(Attendance.objects.exists())

    def test_event_can_be_marked_from_its_exact_start(self):
        with patch('core.api.timezone') as clock:
            clock.now.return_value = self.future.start
            self.assertEqual(self.client.put('/api/v1/attendance/future/').status_code, 204)

    def test_unpublished_events_cannot_be_marked_but_can_be_unmarked(self):
        Attendance.objects.create(user=self.reader, event=self.past)
        Event.objects.filter(pk=self.past.pk).update(published=False)
        self.assertEqual(self.client.put('/api/v1/attendance/past/').status_code, 404)
        self.assertEqual(self.client.put('/api/v1/attendance/unknown/').status_code, 404)
        self.assertEqual(self.client.delete('/api/v1/attendance/past/').status_code, 204)
        self.assertFalse(Attendance.objects.exists())

    def test_favorites_and_attendance_are_independent(self):
        self.client.put('/api/v1/favorites/past/')
        self.assertFalse(Attendance.objects.exists())
        self.client.put('/api/v1/attendance/past/')
        self.client.delete('/api/v1/favorites/past/')
        self.assertTrue(Attendance.objects.filter(user=self.reader).exists())
        self.client.put('/api/v1/favorites/past/')
        self.client.delete('/api/v1/attendance/past/')
        self.assertTrue(Favorite.objects.filter(user=self.reader).exists())
