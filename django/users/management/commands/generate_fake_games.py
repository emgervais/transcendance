from django.core.management.base import BaseCommand, CommandError
from users.models import User
from pong.models import Game
from pong.pybackend.pong import POINTS_TO_WIN, SCREEN_LENGTH
import datetime, random, threading

USERNAME = 'user'
PASSWORD = 'password'
USAGE = 'Usage: python manage.py generate_fake_games [user1] [user2] [number of games]'

def generate_email(username):
    return username + '@gmail.com'

def generate_dates(how_many):
    today = datetime.date.today()
    dates = []
    for i in range(how_many):
        dates.append(today - datetime.timedelta(days=i))
    return dates


def generate_fake_game(user1, user2, date):
    game = Game()
    game.winner = user1 if random.randint(0, 1) == 0 else user2
    game.loser = user1 if game.winner == user2 else user2
    game.score = [POINTS_TO_WIN, random.randint(0, POINTS_TO_WIN - 1)]
    game.date = date
    game.longest_exchange = random.randint(10, 30)
    game.total_exchanges = game.score[0] + game.score[1]
    game.total_hits = random.randint(5, 15) * game.total_exchanges
    game.duration = random.randint(100, 200) * game.total_hits / 100
    game.total_distance = random.randint(125, 175) * game.total_hits * SCREEN_LENGTH / 100
    game.save()

def generate_fake_games(user1, user2, how_many):
    games = []
    dates = generate_dates(how_many)
    
    for i in range(how_many):
        games.append(generate_fake_game(user1, user2, dates[i]))
    return games

def create_user():
    valid = False
    count = 1
    username = USERNAME + str(count)
    email = generate_email(username)
    
    while not valid:
        if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
            count += 1
            username = USERNAME + str(count)
            email = generate_email(username)
        else:
            valid = True
            
    user = User.objects.create_user(username, email, PASSWORD)
    return user

class Command(BaseCommand):
    help = 'Generate fake games between 2 users'
    
    def add_arguments(self, parser):
        parser.add_argument('users', nargs='*', type=str, help='Usernames of the 2 existing users (optional)')
        parser.add_argument('-g', '--games', type=int, default=10, help='Number of games to generate (default is 10)')
        
    def handle(self, *args, **options):
        how_many = options['games']
        if not options['users']:
            user1 = create_user()
            user2 = create_user()
            
        else:
            if len(options['users']) != 2:
                self.stdout.write(self.style.ERROR(USAGE))
                raise CommandError('You must provide 2 usernames')
            user1 = User.objects.filter(username=options['users'][0]).first()
            user2 = User.objects.filter(username=options['users'][1]).first()
            
        if not user1 or not user2:
            raise CommandError('One or both of the provided usernames do not exist')
            
        generate_fake_games(user1, user2, how_many)
        self.stdout.write(self.style.SUCCESS('Successfully generated %d games between %s and %s' % (how_many, user1.username, user2.username)))
        
        if not options['users']:
            self.stdout.write(self.style.SUCCESS('\nAccounts credentials to view the matches:'))
            self.stdout.write(self.style.SUCCESS('Email: %s or %s' % (user1.email, user2.email)))
            self.stdout.write(self.style.SUCCESS('Password: %s' % PASSWORD))
            self.stdout.write(self.style.WARNING('\nBoth users and games will be deleted in 10 minutes'))
            threading.Timer(600, self.delete_users, args=[user1, user2]).start()
            
    def delete_users(self, user1, user2):
        user1.delete()
        user2.delete()
        self.stdout.write(self.style.SUCCESS('\nUsers have been deleted'))
