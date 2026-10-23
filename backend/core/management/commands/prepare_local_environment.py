from django.conf import settings
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from core.models import User


class Command(BaseCommand):
    help = 'On local web startup, remove marked temporary accounts and keep fixed test access.'

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.LOCAL_TEST_ACCOUNTS:
            self.stdout.write('Local test reset disabled.')
            return
        call_command('seed_local_users', stdout=self.stdout)
        temporary = User.objects.filter(is_ephemeral=True)
        ids = {str(pk) for pk in temporary.values_list('pk', flat=True)}
        if ids:
            sessions = [session.session_key for session in Session.objects.iterator(chunk_size=200)
                        if str(session.get_decoded().get('_auth_user_id')) in ids]
            Session.objects.filter(session_key__in=sessions).delete()
            temporary.delete()
        self.stdout.write(self.style.SUCCESS(f'Removed {len(ids)} temporary local accounts.'))
