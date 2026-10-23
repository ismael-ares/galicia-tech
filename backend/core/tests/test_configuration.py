from copy import deepcopy
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
import yaml
from django.conf import settings
from django.test import SimpleTestCase, TestCase, override_settings
from django.db import IntegrityError
from unittest.mock import patch
from django.utils import timezone
from django_q.models import Schedule
from config.app_configuration import ConfigurationError, load_configuration
from core.configuration_service import apply_configuration, check_source_conflicts
from core.models import Attendance, AuditLog, Event, Favorite, ProcessingConfig, ReviewCase, Source, User
from core.services import processing_config


class ConfigurationValidationTests(SimpleTestCase):
    def load(self, document, profile='production'):
        with TemporaryDirectory() as directory:
            path = Path(directory)/'app.yaml'
            path.write_text(yaml.safe_dump(document, allow_unicode=True))
            return load_configuration(path, profile)

    def base(self):
        return deepcopy(settings.APP_CONFIG)

    def test_profiles_are_explicit_and_validated(self):
        document = self.base()
        document['access'].update(registration=False, local_test_accounts=False, require_admin_mfa=True)
        document['profiles'] = {'local': {'access': {'registration': True, 'local_test_accounts': True, 'require_admin_mfa': False}}}
        self.assertFalse(self.load(document).document['access']['registration'])
        self.assertTrue(self.load(document, 'local').document['access']['local_test_accounts'])
        self.assertNotEqual(self.load(document).revision, self.load(document, 'local').revision)
        with self.assertRaises(ConfigurationError): self.load(document, 'nonexistent')
        document['profiles']['local']['access']['typo'] = True
        with self.assertRaises(ConfigurationError): self.load(document)

    def test_rejects_unknown_keys_versions_and_quoted_booleans(self):
        for mutate in [lambda d: d.update(version=2), lambda d: d.update(unknown=True),
                       lambda d: d['access'].update(registration='false'),
                       lambda d: d['collection'].update(scheduler_minutes=True),
                       lambda d: d['collection'].update(weekdays=[1, 1])]:
            document = self.base(); mutate(document)
            with self.assertRaises(ConfigurationError): self.load(document)

    def test_rejects_budget_and_unsupported_paid_execution(self):
        for amount in [-1, 6, float('nan'), '1.001', True]:
            document = self.base(); document['processing']['budget_eur'] = amount
            with self.assertRaises(ConfigurationError): self.load(document)
        document = self.base(); document['processing']['paid_calls_enabled'] = True
        with self.assertRaises(ConfigurationError): self.load(document)

    def test_rejects_duplicate_and_untrusted_sources(self):
        for key, value in [('id', self.base()['sources'][1]['id']), ('url', self.base()['sources'][1]['url']),
                           ('url', 'https://untrusted.example/events/'), ('url', 'https://user:password@gpul.org/'),
                           ('url', 'http://gpul.org/'), ('url', 'https://gpul.org:8443/')]:
            document = self.base(); document['sources'][0][key] = value
            with self.assertRaises(ConfigurationError): self.load(document)

    def test_duplicate_yaml_keys_and_empty_file_are_not_silently_accepted(self):
        with TemporaryDirectory() as directory:
            path = Path(directory)/'app.yaml'
            for text in ['version: 1\nversion: 1\n', '', 'version: [']:
                path.write_text(text)
                with self.assertRaises(ConfigurationError): load_configuration(path)

    def test_valid_pending_file_and_invalid_edit_do_not_reload_runtime(self):
        document = self.base(); active = self.load(document)
        with TemporaryDirectory() as directory:
            path = Path(directory)/'app.yaml'
            document['processing']['budget_eur'] = 1.25
            path.write_text(yaml.safe_dump(document))
            with override_settings(APP_CONFIG=active.document, CONFIG_REVISION=active.revision, APP_CONFIG_PATH=str(path), APP_PROFILE='production'):
                self.assertEqual(processing_config(diagnostics=True)['fileStatus'], 'pending')
                self.assertEqual(processing_config()['budget'], '5.00')
                path.write_text('invalid: true')
                self.assertEqual(processing_config(diagnostics=True)['fileStatus'], 'invalid')
                self.assertEqual(processing_config()['budget'], '5.00')


class ConfigurationSyncTests(TestCase):
    def loaded(self, sources=None):
        document = deepcopy(settings.APP_CONFIG)
        if sources is not None: document['sources'] = sources
        with TemporaryDirectory() as directory:
            path = Path(directory)/'app.yaml'; path.write_text(yaml.safe_dump(document))
            return load_configuration(path)

    def test_sync_is_idempotent_and_updates_policy_and_scheduler(self):
        loaded = self.loaded()
        first = apply_configuration(loaded)
        version = ProcessingConfig.objects.get(pk=1).version
        second = apply_configuration(loaded)
        self.assertEqual(first['created'], len(loaded.document['sources']))
        self.assertEqual(second, {'created': 0, 'updated': 0, 'archived': 0})
        self.assertEqual(ProcessingConfig.objects.get(pk=1).version, version)
        self.assertEqual(AuditLog.objects.filter(action='configuration.apply').count(), 1)
        self.assertEqual(Schedule.objects.get(name='galicia-source-scheduler').minutes, loaded.document['collection']['scheduler_minutes'])

    def test_update_and_removal_preserve_events_and_personal_data(self):
        loaded = self.loaded(); apply_configuration(loaded)
        item = loaded.document['sources'][0]; source = Source.objects.get(pk=item['id'])
        checked = timezone.now()-timedelta(days=1)
        Source.objects.filter(pk=source.pk).update(checked_at=checked, last_error='Retained operational status')
        event = Event.objects.create(id='retained', title='Retained', canonical_url='https://example.org/event', start=timezone.now(), city='A Coruña', community='Community', published=True)
        event.sources.add(source)
        user = User.objects.create_user('retained', email='retained@example.org')
        Favorite.objects.create(user=user, event=event); Attendance.objects.create(user=user, event=event)
        ReviewCase.objects.create(id='retained', event=event, data={})
        changed = deepcopy(loaded.document['sources']); changed[0]['name'] = 'Updated source'; changed[0]['enabled'] = False
        apply_configuration(self.loaded(changed)); source.refresh_from_db()
        self.assertEqual(source.name, 'Updated source'); self.assertFalse(source.enabled)
        self.assertEqual(source.checked_at, checked); self.assertEqual(source.last_error, 'Retained operational status')
        apply_configuration(self.loaded(changed[1:])); source.refresh_from_db()
        self.assertFalse(source.enabled); self.assertEqual(event.sources.get().pk, source.pk)
        self.assertTrue(Event.objects.get(pk=event.pk).published)
        self.assertEqual(Favorite.objects.count(), 1); self.assertEqual(Attendance.objects.count(), 1); self.assertEqual(ReviewCase.objects.count(), 1)

    def test_url_conflict_rolls_back_every_prior_change(self):
        loaded = self.loaded(); apply_configuration(loaded)
        original = loaded.document['sources'][0]
        other = loaded.document['sources'][1]
        Source.objects.filter(pk=other['id']).update(url='https://gpul.org/other')
        Source.objects.create(id='collision', name='Collision', url=other['url'], city='Lugo', platform='Web')
        document = deepcopy(loaded.document['sources']); document[0]['name'] = 'Must roll back'
        before = AuditLog.objects.count()
        with self.assertRaises(ConfigurationError): apply_configuration(self.loaded(document))
        self.assertEqual(Source.objects.get(pk=original['id']).name, original['name'])
        self.assertEqual(AuditLog.objects.count(), before)

    def test_preflight_checks_do_not_apply_valid_changes(self):
        loaded = self.loaded(); apply_configuration(loaded)
        document = deepcopy(loaded.document)
        document['sources'][0]['name'] = 'Not applied'
        version = ProcessingConfig.objects.get(pk=1).version
        check_source_conflicts(document)
        self.assertEqual(Source.objects.get(pk=document['sources'][0]['id']).name, loaded.document['sources'][0]['name'])
        self.assertEqual(ProcessingConfig.objects.get(pk=1).version, version)
        self.assertEqual(AuditLog.objects.filter(action='configuration.apply').count(), 1)

    def test_database_error_mid_sync_rolls_back_prior_source_changes(self):
        loaded = self.loaded(); apply_configuration(loaded)
        changed = deepcopy(loaded.document['sources'])
        changed[0]['name'] = 'Must roll back'; changed[1]['enabled'] = False
        original_save = Source.save
        def fail_second(source, *args, **kwargs):
            if source.pk == changed[1]['id']:
                raise IntegrityError('Simulated database conflict')
            return original_save(source, *args, **kwargs)
        with patch.object(Source, 'save', fail_second):
            with self.assertRaises(IntegrityError): apply_configuration(self.loaded(changed))
        self.assertEqual(Source.objects.get(pk=changed[0]['id']).name, loaded.document['sources'][0]['name'])
        self.assertTrue(Source.objects.get(pk=changed[1]['id']).enabled)
        self.assertEqual(AuditLog.objects.filter(action='configuration.apply').count(), 1)
