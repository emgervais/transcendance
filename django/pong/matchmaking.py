from notification.utils import send_to_websocket
from django.conf import settings
import redis, threading
from users.models import UserChannelGroup, User
from pong.models import Game
from rest_framework import serializers
from channels.layers import get_channel_layer

TOURNAMENT_NB_PLAYERS = 4

matchmaking_redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
matchmaking_lock = threading.Lock()

class DictPosSerializer(serializers.Serializer):
    def to_representation(self, instance):
        return {
            '1st': instance['1st'],
            '2nd': instance['2nd'],
            '3rd': instance['3rd'],
            '4th': instance['4th']
        }

def tournament_notification(tournament_id, winners, losers, new_game):
    channel_layer = get_channel_layer()
    try:
        if new_game:
            winner_room = '_'.join(sorted([str(user) for user in winners]))
            loser_room = '_'.join(sorted([str(user) for user in losers]))
            for user in winners:
                send_to_websocket(channel_layer, UserChannelGroup.objects.get(user_id=user).main, {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'matchFound', 'room': winner_room, 'tournamentId': tournament_id + '_1'
                })
            for user in losers:
                send_to_websocket(channel_layer, UserChannelGroup.objects.get(user_id=user).main, {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'matchFound', 'room': loser_room, 'tournamentId': tournament_id + '_1'
                })
        else:
            positions = {
                '1st': winners[1],
                '2nd': losers[1],
                '3rd': winners[0],
                '4th': losers[0],
            }
            winner_game = Game.objects.get_penultimate_game(winners[0]).winner.id
            if (winners[0] == winner_game):
                positions['1st'] = winners[0]
                positions['3rd'] = winners[1]
                
            loser_game = Game.objects.get_penultimate_game(losers[0]).winner.id
            if (losers[0] == loser_game):
                positions['2nd'] = losers[0]
                positions['4th'] = losers[1]

            for key, value in positions.items():
                positions[key] = User.objects.get(id=value).username
            for user in winners + losers:
                send_to_websocket(channel_layer, UserChannelGroup.objects.get(user_id=user).main, {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'tournamentSummary', 'positions': DictPosSerializer().to_representation(positions)
                })
    except UserChannelGroup.DoesNotExist:
        pass

def next_round(tournament_id):
    if matchmaking_redis.zcard(tournament_id) == TOURNAMENT_NB_PLAYERS / 2:
        games = []
        winners = []
        losers = []
        
        users = tournament_id.split('_')
        new_game = True
        
        if len(users) == 5:
            new_game = False
            users = users[:-1]
            
        for user in users:
            game = Game.objects.get_last_game(user)
            if game in games:
                continue
            games.append(game)
            
        for game in games:
            winners.append(game.winner.id)
            losers.append(game.loser.id)

        tournament_notification(tournament_id, winners, losers, new_game)
        matchmaking_redis.delete(tournament_id)
        
            
def matchmaker(room):
    min_players = TOURNAMENT_NB_PLAYERS if room == 'tournament' else 2
    tournament_id = None
    while True:
        print('In Queue...')
        if matchmaking_redis.zcard(room) >= min_players:
            print('Match found')
            users = matchmaking_redis.zrange(room, 0, min_players - 1)
            if not User.objects.filter(id=users[0], status='online').exists():
                matchmaking_redis.zremrangebyrank(room, 0, 0)
                continue
            channel_layer = get_channel_layer()
            if room == 'tournament':
                tournament_id = '_'.join(sorted([str(user.decode('utf-8')) for user in users]))
            for i in range(0, min_players, 2):
                room_name = '_'.join(sorted([users[i].decode('utf-8'), users[i+1].decode('utf-8')]))
                try:
                    send_to_websocket(channel_layer, UserChannelGroup.objects.get(user_id=users[i]).main, {
                        'type': 'send.notification', 'notification': 'pong', 'description': 'matchFound', 'room': room_name, 'tournamentId': tournament_id
                    })
                    send_to_websocket(channel_layer, UserChannelGroup.objects.get(user_id=users[i+1]).main, {
                        'type': 'send.notification', 'notification': 'pong', 'description': 'matchFound', 'room': room_name, 'tournamentId': tournament_id
                    })
                except UserChannelGroup.DoesNotExist:
                    break
            matchmaking_redis.zremrangebyrank(room, 0, min_players - 1)
        else:
            print('Not enough players')
            break

async def async_send_to_websocket(channel_layer, channel_name, event):
    if channel_name:
        await channel_layer.send(channel_name, event)
    else:
        print('Channel name not found')