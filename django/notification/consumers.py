import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import UserChannelGroup, User
from friend.models import Friend
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time, threading
import redis
from django.conf import settings

matchmaking_redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

async def search_match(user_id):
    matchmaking_redis.zadd('global', {user_id: time.time()})

async def cancel_search(user_id):
    matchmaking_redis.zrem('global', user_id)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.pong_queue = ''
        
        if not self.user.is_authenticated:
            await self.close()
        else:
            if self.user.status == 'offline':
                await change_status(self.user, 'online')
                await self.online_friends_notify(True)
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
            if data.get('cancel', False) and self.pong_queue != '':
                self.pong_queue = ''
                await cancel_search(self.user.id)
            else:
                if self.pong_queue != '' and self.pong_queue == room:
                    self.pong_queue = ''
                    await self.send(text_data=json.dumps({
                        'type': 'pong',
                        'room': room
                    }))
                elif self.pong_queue == '':
                    self.pong_queue = room
                    if room == 'global':
                        await search_match(self.user.id)
                    else:
                        await self.send_game_request(room)

    async def send_game_request(self, room):
        recipients = room.split('_')
        recipient_id = recipients[0] if recipients[0] != str(self.user.id) else recipients[1]
        try:
            recipient = User.objects.get(id=recipient_id)
            main_channel = await get_main_channel(recipient)
            if main_channel:
                await self.channel_layer.send(main_channel, {
                    'type': 'pong.request',
                    'room': room
                })
        except User.DoesNotExist:
            print('Recipient not found')
        except UserChannelGroup.DoesNotExist:
            print('Recipient channel group not found')
        except Exception as e:
            print('Error:', e)
        
    async def websocket_close(self, event):
        await self.close()
    
    async def send_notification(self, event):
        notification = event['notification']
        room = event['room']
        await self.send(text_data=json.dumps({
            'type': notification,
            'room': room
        }))
        
    async def pong_request(self, event):
        room = event['room']
        await self.send(text_data=json.dumps({
            'type': 'pong_request',
            'room': room
        }))

    async def user_online(self, event):
        notification = event['notification']
        connected = event['connected']
        userId = event['userId']

        await self.send(text_data=json.dumps({
            'type': notification,
            'connected': connected,
            'userId': userId
        }))
        
    async def friend_request(self, event):
        type = event['notification']
        userId = event['userId']

        await self.send(text_data=json.dumps({
            'type': type,
            'userId': userId
        }))
    
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
    
    async def online_friends_notify(self, connected):
        friends = await get_online_friends(self.user)
        if friends:
            for friend in friends:
                channel_name = await get_main_channel(friend)
                if channel_name:
                    await self.channel_layer.send(channel_name, {
                        'type': 'user.online',
                        'notification': 'connection',
                        'connected': connected,
                        'userId': self.user.id
                    })

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
                        'type': 'user.online',
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
                'type': 'friend.request',
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
                    'type': 'user.online',
                    'notification': 'connection',
                    'connected': True,
                    'userId': user.id
                })
            channel_name = UserChannelGroup.objects.get(user=user).main
            if channel_name:
                async_to_sync(channel_layer.send)(channel_name, {
                    'type': 'user.online',
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
def get_main_channel(user):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        return user_channel_group.main
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
    