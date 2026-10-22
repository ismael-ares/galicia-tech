from getpass import getpass
from django.contrib.auth.password_validation import validate_password
from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from allauth.mfa.models import Authenticator
from core.models import AuditLog, User

class Command(BaseCommand):
    help = 'Offline owner recovery, with password validation, session revocation and optional MFA reset.'
    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
        parser.add_argument('--reset-mfa', action='store_true')
    @transaction.atomic
    def handle(self, *args, **options):
        try:
            user = User.objects.select_for_update().get(email__iexact=options['email'], is_superuser=True)
        except User.DoesNotExist:
            raise CommandError('Owner not found.')
        password = getpass('Nueva contraseña: ')
        validate_password(password, user)
        if password != getpass('Repite la contraseña: '):
            raise CommandError('Passwords do not match.')
        if options['reset_mfa']:
            if input('Eliminar MFA y sus códigos de recuperación. Escribe RESET: ') != 'RESET':
                raise CommandError('Cancelled.')
            Authenticator.objects.filter(user=user).delete()
        user.set_password(password);user.save()
        for session in Session.objects.iterator():
            if session.get_decoded().get('_auth_user_id') == str(user.pk):
                session.delete()
        AuditLog.objects.create(actor=user, action='owner.recovery', target=str(user.public_id), details={'mfaReset': options['reset_mfa']})
        self.stdout.write(self.style.SUCCESS('Password updated and sessions revoked. Configure MFA again if it was reset.'))
