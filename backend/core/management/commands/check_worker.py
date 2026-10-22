import socket
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django_q.status import Stat

class Command(BaseCommand):
    def handle(self, *args, **options):
        if not any(stat.host == socket.gethostname() and (timezone.now() - stat.timestamp).total_seconds() < 15 for stat in Stat.get_all()):
            raise CommandError('No recent worker heartbeat.')
