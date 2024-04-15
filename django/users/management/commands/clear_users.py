from django.core.management.base import BaseCommand, CommandError
from users.models import User

class Command(BaseCommand):
    help = 'Remove all users'

    def handle(self, *args, **options):
        try:
            User.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Successfully deleted all users'))
        except Exception as e:
            self.stdout.write(self.style.SUCCESS('Couldn\'t deleted all users:', e))