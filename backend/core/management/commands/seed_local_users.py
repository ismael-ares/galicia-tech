from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from allauth.account.models import EmailAddress
from core.models import User


class Command(BaseCommand):
    help = 'Provision the explicitly enabled local admin/admin and user/user fixtures.'

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.LOCAL_TEST_ACCOUNTS:
            raise CommandError('Local test accounts are disabled. Enable LOCAL_TEST_ACCOUNTS only for local testing.')
        for name, staff in [('admin', True), ('user', False)]:
            email = name + '@galicia-tech.test'
            user = User.objects.filter(email__iexact=email).first()
            conflict = User.objects.filter(username__iexact=name)
            if user:
                conflict = conflict.exclude(pk=user.pk)
                if user.is_superuser or user.is_staff != staff:
                    raise CommandError('Refusing to replace a different account at ' + email)
            if conflict.exists():
                raise CommandError('Username already belongs to another account: ' + name)
            user = user or User(email=email)
            user.username = user.first_name = name
            user.is_staff = staff
            user.is_superuser = False
            user.is_ephemeral = False
            # Explicit local fixtures only; normal signup keeps its password validators.
            if not user.check_password(name):
                user.set_password(name)
            user.save()
            EmailAddress.objects.update_or_create(user=user, email=email, defaults={'primary': True, 'verified': True})
        self.stdout.write(self.style.SUCCESS('Local accounts ready: admin/admin and user/user.'))
