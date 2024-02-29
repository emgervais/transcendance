import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model

from users.models import User, UserWebSocket, ChannelGroup
from .censor import censor

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

@database_sync_to_async
def change_status(user, status):
    try:
        user.status = status
        user.save()
    except Exception as e:
        # Handle exception
        pass
    
# Websocket utilities
@database_sync_to_async
def get_user_websockets(user):
    try:
        return UserWebSocket.objects.get(user=user).channel_names
    except UserWebSocket.DoesNotExist:
        return None
    
@database_sync_to_async
def get_user_websocket(user):
    try:
        return UserWebSocket.objects.get(user=user).main_channel
    except UserWebSocket.DoesNotExist:
        return None
    
@database_sync_to_async
def add_channel_name(user, channel_name):
    try:
        user_websocket = UserWebSocket.objects.get(user=user)
        user_websocket.add_channel_name(channel_name)
    except UserWebSocket.DoesNotExist:
        UserWebSocket.objects.create(user=user, channel_names=[channel_name])

@database_sync_to_async
def remove_channel_name(user, channel_name):
    try:
        user_websocket = UserWebSocket.objects.get(user=user)
        user_websocket.remove_channel_name(channel_name)
    except UserWebSocket.DoesNotExist:
        print(user, "does not have a websocket connection")

@database_sync_to_async
def set_main_channel(user, channel_name):
    try:
        user_websocket = UserWebSocket.objects.get(user=user)
        user_websocket.set_main_channel(channel_name)
    except UserWebSocket.DoesNotExist:
        UserWebSocket.objects.create(user=user, main_channel=channel_name)
        
# Group utilities 
@database_sync_to_async
def add_member(group_name, user):
    try:
        channel_group = ChannelGroup.objects.get(name=group_name)
        channel_group.members.add(user)
    except Exception as e:
        channel_group = ChannelGroup.objects.create(name=group_name)
        channel_group.members.add(user)

@database_sync_to_async
def remove_member(group_name, user):
    try:
        channel_group = ChannelGroup.objects.get(name=group_name)
        channel_group.members.remove(user)
    except Exception as e:
        # Handle exceptions appropriately
        pass
    
@database_sync_to_async
def in_group(recipient, group_name):
    try:
        group = ChannelGroup.objects.get(name=group_name)
        if group.in_group(recipient):
            return None
    except ChannelGroup.DoesNotExist:
        # retrieve main channel of recipient to notify them to create a new websocket connection
        return get_user_websocket(recipient)

@database_sync_to_async
def get_group_list(user):
    try:
        group_name = [group.name for group in user.channel_groups.all()]
        group_name.remove('global')
        print("all groups")
        print(group_name)
        return group_name
    except Exception as e:
        return None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        
        if not user.is_authenticated:
            await self.close()
        else:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            self.room_group_name = f"chat_{self.room_name}"         
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await add_channel_name(user, self.channel_name)
            await add_member(self.room_name, user)
            if self.room_name != 'global':
                await self.private_room(user)
            print('chat connected')
            await self.accept()
                
    
    async def disconnect(self, close_code):
        user = self.scope["user"]

        if user.is_authenticated:
            self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            await remove_channel_name(user, self.channel_name)
            await remove_member(self.room_name, user)
            await self.close()
        print('disconnected chat consumer')
        
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope["user"]
                    
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': user.id
            }
        )

    async def chat_message(self, event):
        message = censor(event['message'])
        sender_id = event['sender_id']
        
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))
        
    async def private_room(self, user):
        recipient_ids = self.room_name.split('_')
        if len(recipient_ids) == 2:
            recipient_id = recipient_ids[0] if recipient_ids[0] != str(user.id) else recipient_ids[1]
            recipient = await get_user(recipient_id)
            if recipient and recipient.status == 'online':
                main_channel = await in_group(recipient, self.room_name)
                if main_channel:
                    print('sending notification')
                    await main_channel.send(text_data=json.dumps({
                        'notification': 'chat',
                        'sender_id': user.id,
                        'room': self.room_name
                    }))
            else:
                await self.close()
        else:
            await self.close()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close()
        else:
            self.main_channel = await set_main_channel(user, self.channel_name)
            await add_channel_name(user, self.channel_name)
            await change_status(user, 'online')
            print('connected NotificationConsumer')
            self.group_list = await get_group_list(user)
            print(self.group_list)
            if self.group_list:
                for group in self.group_list:
                    await self.send(text_data=json.dumps({
                        'notification': 'chat',
                        'room': group
                    }))
            await self.accept()
            
    async def disconnect(self, close_code):
        user = self.scope["user"]
        
        if user.is_authenticated:
            await remove_channel_name(user, self.channel_name)
            await change_status(user, 'offline')
            await set_main_channel(user, '')
            await self.close()
        print('disconnected NotificationConsumer')