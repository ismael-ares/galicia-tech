from getpass import getpass
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from allauth.account.models import EmailAddress
from core.models import User

class Command(BaseCommand):
    help = 'Provision an owner interactively on the server. No default credentials.'
    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)
    @transaction.atomic
    def handle(self, *args, **options):
        email = options['email'].strip().casefold()
        if User.objects.filter(email__iexact=email).exists():
            raise CommandError('This account already exists; use changepassword to recover it.')
        from django.core.validators import validate_email
        validate_email(email)
        user = User(username=email, email=email, is_staff=True, is_superuser=True)
        password = getpass('Contraseña: ')
        validate_password(password, user)
        if password != getpass('Repite la contraseña: '):
            raise CommandError('Passwords do not match.')
        user.set_password(password); user.save()
        EmailAddress.objects.create(user=user, email=email, primary=True, verified=True)
        self.stdout.write(self.style.SUCCESS('Owner created. Sign in and configure two-factor authentication in your account.'))
