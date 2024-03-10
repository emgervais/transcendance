import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import UserChannelGroup, User
from friend.models import Friend
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time, threading
import redis
import redis.lock
import json
from django.conf import settings

matchmaking_redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)
matchmaking_lock = redis.lock.Lock(matchmaking_redis, 'matchmaking_lock', timeout=1)

async def get_opponent_id(room, user_id):
    users = room.split('_')
    return users[0] if users[0] != str(user_id) else users[1]

def matchmaker(room):
    if not matchmaking_lock.locked():
        matchmaking_lock.acquire()
        try:
            while True:
                print('In Queue...')
                matchmaking_redis.zremrangebyscore(room, '-inf', time.time() - 600)
                if matchmaking_redis.zcard(room) > 1:
                    users = matchmaking_redis.zrange(room, 0, 1)
                    room_name = '_'.join(sorted([users[0].decode('utf-8'), users[1].decode('utf-8')]))
                    channel_layer = get_channel_layer()
                    for user in users:
                        try:
                            opponent_channel = UserChannelGroup.objects.get(user_id=user).main
                            if opponent_channel:
                                async_to_sync(channel_layer.send)(opponent_channel, {
                                    'type': 'send.notification',
                                    'notification': 'matchFound',
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
            if data.get('cancel', False) and self.in_queue:
                self.in_queue = False
                await self.cancel_search(room)
            elif not self.in_queue:
                self.in_queue = True
                await self.search_match(room)
                matchmaker_thread = threading.Thread(target=matchmaker, args=(room,))
                matchmaker_thread.start()
            
    async def websocket_close(self, event):
        await self.close()
    
    async def send_notification(self, event):
        params = event
        params['type'] = params.pop('notification')

        await self.send(text_data=json.dumps(params))
    
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
            opponent_id = await get_opponent_id(room, self.user.id)
            if opponent_id and matchmaking_redis.zrank(room, opponent_id) is None:
                opponent_channel = await get_main_channel(opponent_id, True)
                if opponent_channel:
                    await self.channel_layer.send(opponent_channel, {
                        'type': 'send.notification',
                        'notification': 'matchRequest',
                        'room': room,
                        'userId': self.user.id
                    })
        matchmaking_redis.zadd(room, {self.user.id: time.time()})

    async def cancel_search(self, room):
        matchmaking_redis.zrem(room, self.user.id)
        await self.send(text_data=json.dumps({
            'type': 'searchCancelled',
            'room': room
        }))
        
# Helper functions
def user_disconnect(user):
    time.sleep(5)
    main = UserChannelGroup.objects.get(user=user).main
    should_disconnect = main == '' and user.status == 'online'
    if should_disconnect:
        user.status = 'offline'
        user.save()
        friends = Friend.objects.online_friends(user)
        if friends:
            channel_layer = get_channel_layer()
            for friend in friends:
                channel_name = UserChannelGroup.objects.get(user=friend).main
                if channel_name:
                    async_to_sync(channel_layer.send)(channel_name, {
                        'type': 'send.notification',
                        'notification': 'connection',
                        'connected': False,
                        'userId': user.id
                    })
        clear_user_channels(user)

def close_recipient_channel(user_id, group, channel_layer):
    users = group.split('_')
    recipient_id = users[0] if users[0] != str(user_id) else users[1]
    
    try:
        recipient = User.objects.get(id=recipient_id)
        recipient_channel_groups = UserChannelGroup.objects.get(user=recipient)
        recipient_channel = recipient_channel_groups.get_channel_name(group)
        if recipient_channel:
            async_to_sync(channel_layer.send)(recipient_channel, {
                'type': 'chat.message',
                'message': 'User is offline',
                'senderId': user_id,
                'closing': True
            })
    except User.DoesNotExist:
        print('Recipient not found')
        
def clear_user_channels(user):
    try:
        channel_groups = UserChannelGroup.objects.get(user=user)
        channel_layer = get_channel_layer()
        channel_groups_pairs = channel_groups.channel_groups
        channel_groups.remove_all_channel_groups()

        for channel, group in channel_groups_pairs.items():
            close_websocket(channel_layer, channel)
            if group != 'global':
                close_recipient_channel(user.id, group, channel_layer)

    except UserChannelGroup.DoesNotExist:
        print('User channel group not found')
    except Exception as e:
        print('Error:', e)

def close_websocket(channel_layer, channel):
    try:
        async_to_sync(channel_layer.send)(channel, {'type': 'websocket.close'})
    except Exception as e:
        print('Error:', e)
        
def friend_request_notify(user_id, friend, friend_request_id):
    try:
        channel_name = UserChannelGroup.objects.get(user=friend).main
        if channel_name:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.send)(channel_name, {
                'type': 'send.notification',
                'notification': 'friendRequest',
                'userId': user_id,
                'id': friend_request_id
            })
    except UserChannelGroup.DoesNotExist:
        print('Friend channel group not found')
    except Exception as e:
        print('Error:', e)
        
def accept_friend_request_notify(user, friend):
    try:
        if friend.status == 'online':
            channel_name = UserChannelGroup.objects.get(user=friend).main
            if channel_name:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.send)(channel_name, {
                    'type': 'send.notification',
                    'notification': 'connection',
                    'connected': True,
                    'userId': user.id
                })
            channel_name = UserChannelGroup.objects.get(user=user).main
            if channel_name:
                async_to_sync(channel_layer.send)(channel_name, {
                    'type': 'send.notification',
                    'notification': 'connection',
                    'connected': True,
                    'userId': friend.id
                })
    except UserChannelGroup.DoesNotExist:
        print('Friend channel group not found')
    except Exception as e:
        print('Error:', e)
        
# Database operations for the consumer
@database_sync_to_async
def change_status(user, status):
    user.status = status
    user.save()

@database_sync_to_async
def set_main_channel(user, channel_name):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        user_channel_group.main = channel_name
        user_channel_group.save()
    except UserChannelGroup.DoesNotExist:
        UserChannelGroup.objects.create(user=user, main=channel_name)
    
@database_sync_to_async
def get_group_list(user):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        return user_channel_group.get_group_names()
    except UserChannelGroup.DoesNotExist:
        return None
    
@database_sync_to_async
def get_main_channel(user, id=False):
    try:
        if id:
            return UserChannelGroup.objects.get(user__id=user).main
        return UserChannelGroup.objects.get(user=user).main
    except UserChannelGroup.DoesNotExist:
        return None
    
@database_sync_to_async
def get_online_friends(user, ids_only=False):
    try:
        friends = Friend.objects.online_friends(user, ids_only)
        return friends
    except Exception as e:
        print('Error:', e)

@database_sync_to_async
def friend_request_count(user):
    try:
        return Friend.objects.requests(user).count()
    except Exception:
        return 0
    