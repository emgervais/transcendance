import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import UserChannelGroup, User
from friend.models import Friend
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

@database_sync_to_async
def change_status(user, status):
    try:
        user.status = status
        user.save()
    except Exception as e:
        print('Error:', e)

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
def get_online_friends(user):
    try:
        return Friend.objects.online_friends(user)
    except Exception as e:
        print('Error:', e)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close()
        else:
            old_channel = await get_main_channel(user)
            if old_channel:
                try:
                    await self.channel_layer.send(old_channel, {
                        'type': 'websocket.disconnect',
                        'code': 1000,
                    })
                except:
                    print('Error closing old channel')
            else:
                if user.status == 'offline':
                    await change_status(user, 'online')
                    await self.online_friends_notify(True)
            await set_main_channel(user, self.channel_name)
            await self.accept()
            await self.reconnect_chats()
                        
    async def reconnect_chats(self):
        user = self.scope["user"]
        
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'room': 'global'
        }))
        group_list = await get_group_list(user)
        if group_list:
            for group in group_list:
                if group != 'global':
                    await self.send(text_data=json.dumps({
                        'type': 'chat',
                        'room': group
                    }))
    
    async def disconnect(self, close_code):
        user = self.scope["user"]
        if user.is_authenticated:
            await set_main_channel(user, '')
            if user.status == 'online':
                await change_status(user, 'offline')
                await self.online_friends_notify(False)
            await self.close()
        
    async def send_notification(self, event):
        notification = event['notification']
        room = event['room']
        await self.send(text_data=json.dumps({
            'type': notification,
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
        
    # notify all online friends that user is online
    async def online_friends_notify(self, connected):
        user = self.scope["user"]
        friends = await get_online_friends(user)
        if friends:
            for friend in friends:
                channel_name = await get_main_channel(friend)
                if channel_name:
                    await self.channel_layer.send(channel_name, {
                        'type': 'user_online',
                        'notification': 'connection',
                        'connected': connected,
                        'userId': user.id
                    })
                    

def close_websockets(user):
        try:
            channel_layer = get_channel_layer()
            channels = UserChannelGroup.objects.get(user=user).channel_groups.keys()
            channel_groups = UserChannelGroup.objects.get(user=user)
            for channel in channels:
                try:
                    async_to_sync(channel_layer.send)(channel, {
                        'type': 'websocket.disconnect',
                        'code': 1000,
                    })
                except:
                    print('Error closing channel')
                channel_groups.remove_channel_group(channel)
            try:
                async_to_sync(channel_layer.send)(channel_groups.main, {
                    'type': 'websocket.disconnect',
                    'code': 1000,
                })
            except:
                print('Error closing main channel')
        except UserChannelGroup.DoesNotExist:
            print('User channel group not found')
        except Exception as e:
            print('Error:', e)
