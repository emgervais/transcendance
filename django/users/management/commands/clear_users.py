import os
import glob
from django.core.management.base import BaseCommand, CommandError
from users.models import User

class Command(BaseCommand):
    help = 'Remove all users'
    profile_pics_dir = '/usr/src/app/media/profile_pics/'

    def remove_profile_pics(self):
        self.stdout.write("Removing profile pictures")
        file_pattern = os.path.join(self.profile_pics_dir, "*")
        files = glob.glob(file_pattern)
        if len(files) == 0:
            self.stdout.write("No profiles pictures found")
        for f in files:
            try:
                os.remove(f)
                self.stdout.write(f"Removed: {f}")
            except OSError as e:
                self.stderr.write(f"Error: {f} - {e.strerror}")


    def handle(self, *args, **options):
        try:
            User.objects.all().delete()
            self.remove_profile_pics()
            self.stdout.write(self.style.SUCCESS('Successfully deleted all users'))
        except Exception as e:
            self.stdout.write(self.style.SUCCESS('Couldn\'t deleted all users:', e))