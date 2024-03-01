import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import UserChannelGroup

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
            await set_main_channel(user, self.channel_name)
            await change_status(user, 'online')
            await self.accept()
            group_list = await get_group_list(user)
            if group_list:
                for group in group_list:
                    if group != 'global':
                        await self.send(text_data=json.dumps({
                            'notification': 'chat',
                            'room': group
                        }))
    
    async def disconnect(self, close_code):
        user = self.scope["user"]

        if user.is_authenticated:
            await set_main_channel(user, '')
            await change_status(user, 'offline')
            await self.close()
        
    async def send_notification(self, event):
        notification = event['notification']
        room = event['room']
        await self.send(text_data=json.dumps({
            'notification': notification,
            'room': room
        }))