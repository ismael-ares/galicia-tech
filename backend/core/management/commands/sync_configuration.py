from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError
from config.app_configuration import ConfigurationError
from core.configuration_service import apply_configuration, check_source_conflicts


class Command(BaseCommand):
    help = 'Apply the validated YAML to source records and the scheduler, preserving events and observations.'

    def add_arguments(self, parser):
        parser.add_argument('--check', action='store_true', help='Check source identities against the database without writing.')

    def handle(self, *args, **options):
        try:
            if options['check']:
                check_source_conflicts(settings.APP_CONFIG)
                self.stdout.write(self.style.SUCCESS('YAML compatible con la base de datos. No se han aplicado cambios.'))
                return
            result = apply_configuration(settings.LOADED_CONFIG)
        except (ConfigurationError, IntegrityError) as error:
            raise CommandError('No se ha aplicado la configuración; la transacción se ha revertido. ' +
                               (str(error) if isinstance(error, ConfigurationError) else 'Conflicto entre identificadores o URLs de fuentes.')) from None
        self.stdout.write(self.style.SUCCESS(f'YAML aplicado · {settings.APP_PROFILE} · {settings.CONFIG_REVISION[:12]} · {result}'))
