from django.core.management.base import BaseCommand, CommandError
from users.models import User

class Command(BaseCommand):
    help = 'Create a user'

    def add_arguments(self, parser):
        parser.add_argument('status', type=str)

    def handle(self, *args, **options):
        users = User.objects.all()
        if len(users) != 0:
            for user in users:
                if user.status == options['status']:
                    continue
                user.status = options['status']
                user.save()
                self.stdout.write(self.style.SUCCESS('Successfully changed status of user "%s"' % user.username))
        else:
            print('No users found')