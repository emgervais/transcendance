from channels.generic.websocket import AsyncWebsocketConsumer
from users.models import UserChannelGroup
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time, threading, redis, json
from django.conf import settings
from notification.utils import get_opponent_id, user_disconnect
from notification.utils_db import change_status, set_main_channel, get_group_list, get_main_channel, get_online_friends, friend_request_count, get_user

matchmaking_redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
matchmaking_lock = redis.lock.Lock(matchmaking_redis, 'matchmaking_lock', timeout=1)

def matchmaker(room):
    if not matchmaking_lock.locked():
        matchmaking_lock.acquire()
        try:
            while True:
                print('In Queue...')
                # matchmaking_redis.zremrangebyscore(room, '-inf', time.time() - 600)
                if matchmaking_redis.zcard(room) > 1:
                    print('Match found')
                    users = matchmaking_redis.zrange(room, 0, 1)
                    room_name = '_'.join(sorted([users[0].decode('utf-8'), users[1].decode('utf-8')]))
                    channel_layer = get_channel_layer()
                    for user in users:
                        try:
                            opponent_channel = UserChannelGroup.objects.get(user_id=user).main
                            if opponent_channel:
                                async_to_sync(channel_layer.send)(opponent_channel, {
                                    'type': 'send.notification',
                                    'notification': 'pong',
                                    'description': 'matchFound',
                                    'room': room_name
                                })
                        except UserChannelGroup.DoesNotExist:
                            break
                    matchmaking_redis.zrem(room, users[0], users[1])
                elif matchmaking_redis.zcard(room) == 1:
                    print('One user in queue')
                    break
                else:
                    print('No users in queue')
                    break
        finally:
            matchmaking_lock.release()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.in_queue = False
        self.current_queue = ''

        if not self.user.is_authenticated:
            await self.close()
        else:
            if self.user.status == 'offline':
                await change_status(self.user, 'online')
                await self.notify_online_status_to_friends(True)
            await set_main_channel(self.user, self.channel_name)
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'onlineFriends',
                'userIds': await get_online_friends(self.user, ids_only=True)
            }))
            await self.send(text_data=json.dumps({
                'type': 'friendRequests',
                'count': await friend_request_count(self.user)
            }))
            await self.reconnect_chats()
    
    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await set_main_channel(self.user, '')
            disconnect_thread = threading.Thread(target=user_disconnect, args=(self.user,))
            disconnect_thread.start()
  
    async def receive(self, text_data):
        data = json.loads(text_data)
        type = data['type']
        room = data.get('room', 'global')

        if type == 'matchmaking':
            if data.get('cancel', False) and self.current_queue == room:
                if not await self.is_refusing_match(room) and self.in_queue:
                    await self.cancel_search()
            else:
                if self.current_queue != room:
                    await self.cancel_search()
                await self.search_match(room)
            
    async def websocket_close(self, event):
        await self.close()
    
    async def send_notification(self, event):
        params = event
        params['type'] = params.pop('notification')

        await self.send(text_data=json.dumps(params))
        if params['type'] == 'matchFound':
            self.in_queue = False
        elif params['type'] == 'matchRefused':
            await self.cancel_search()
    
    async def reconnect_chats(self):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'room': 'global'
        }))
        group_list = await get_group_list(self.user)
        if group_list:
            for group in group_list:
                if group != 'global':
                    await self.send(text_data=json.dumps({
                        'type': 'chat',
                        'room': group
                    }))
    
    async def notify_online_status_to_friends(self, connected):
        friends = await get_online_friends(self.user)
        if friends:
            for friend in friends:
                channel_name = await get_main_channel(friend)
                if channel_name:
                    await self.channel_layer.send(channel_name, {
                        'type': 'send.notification',
                        'notification': 'connection',
                        'connected': connected,
                        'userId': self.user.id
                    })

    async def search_match(self, room):
        if room != 'global':
            if not await self.send_match_request(room):
                print("cancel")
                return
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'description': 'searchingMatch',
            'room': room
        }))
        matchmaking_redis.zadd(room, {self.user.id: time.time()})
        self.in_queue = True
        self.current_queue = room
        matchmaker_thread = threading.Thread(target=matchmaker, args=(room,))
        matchmaker_thread.start()

    async def cancel_search(self):
        matchmaking_redis.zrem(self.current_queue, self.user.id)
        self.in_queue = False
        self.current_queue = ''
        
    async def is_refusing_match(self, room):
        if room != 'global':
            opponent_id = await get_opponent_id(room, self.user.id)
            if opponent_id and matchmaking_redis.zrank(room, opponent_id) is not None:
                opponent_channel = await get_main_channel(opponent_id, True)
                if opponent_channel:
                    await self.channel_layer.send(opponent_channel, {
                        'type': 'send.notification',
                        'notification': 'pong',
                        'description': 'matchRefused',
                        'room': room
                    })
                return True
        return False
    
    async def send_match_request(self, room):
        opponent_id = await get_opponent_id(room, self.user.id)
        opponent = await get_user(opponent_id)
        if opponent:
            opponent_channel = await get_main_channel(opponent_id, True)
            if opponent.status == 'online':
                if matchmaking_redis.zrank(room, opponent_id) is None:
                    print('Sending match request')
                    if opponent_channel:
                        await self.channel_layer.send(opponent_channel, {
                            'type': 'send.notification',
                            'notification': 'pong',
                            'description': 'matchRequest',
                            'room': room,
                            'userId': self.user.id
                        })
                return True
            elif opponent.status == 'in-game':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'description': 'opponentInGame',
                    'userId': opponent_id
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'description': 'opponentOffline',
                    'userId': opponent_id
                }))
        return False