import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import User, UserWebSocket
# from chat.censor import censor

from typing import List

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    
@database_sync_to_async
def is_in_room(user, room_name):
    try:
        user_websocket = UserWebSocket.objects.get(user=user)
        return room_name in user_websocket.channel_names
    except UserWebSocket.DoesNotExist:
        return False

@database_sync_to_async
def change_status(user, status):
    try:
        user.status = status
        user.save()
    except Exception as e:
        # Handle exception
        pass

@database_sync_to_async
def add_channel_name(user, channel_name):
    try:
        user_websocket, _ = UserWebSocket.objects.get_or_create(user=user)
        if channel_name not in user_websocket.channel_names:
            user_websocket.channel_names.append(channel_name)
            user_websocket.save()
    except Exception as e:
        # Handle exception
        pass
    
@database_sync_to_async
def remove_channel_name(user, channel_name):
    try:
        user_websocket = UserWebSocket.objects.get(user=user)
        if channel_name in user_websocket.channel_names:
            user_websocket.channel_names.remove(channel_name)
            user_websocket.save()
    except Exception as e:
        # Handle exception
        pass

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
            if self.room_name == 'global':
                await self.accept()
            else:
                await self.private_room(user)
    
    async def private_room(self, user):
        recipient_ids = self.room_name.split('_')
        if len(recipient_ids) == 2:
            recipient_id = recipient_ids[0]
            if recipient_id == str(user.id):
                recipient_id = recipient_ids[1]
            recipient = await get_user(recipient_id)
            if recipient and not await is_in_room(recipient, self.room_name) and recipient.status == 'online':
                await self.channel_layer.group_send(
                    f"notifications_{recipient.id}",
                    {
                        'type': 'notify',
                        'notification': 'chat',
                        'sender_id': user.id,
                        'room': self.room_name
                    }
                )
            await self.accept()
        else:
            await self.close()
            
    async def disconnect(self, close_code):
        user = self.scope["user"]

        if user.is_authenticated:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            await remove_channel_name(user, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope["user"]
        message = f"{user}: {message}"
                    
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': user.id
            }
        )
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']
        
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))
        
    async def logout(self, code):
        self.close()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        
        if not user.is_authenticated:
            await self.close()
        else:
            self.room_name = f"notifications_{user.id}"
            self.room_group_name = self.room_name
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await add_channel_name(user, self.channel_name)
            if user.status == 'offline':
                await change_status(user, 'online')
            self.clear_all_user_channels(user)
            await self.accept()
                
    async def disconnect(self, close_code):
        user = self.scope["user"]

        if user.is_authenticated:
            await remove_channel_name(user, self.channel_name)
            if user.status == 'online':
                await change_status(user, 'offline')
    
    async def notify(self, event):
        notification = event['notification']
        sender_id = event['sender_id']
        room = event['room']
        
        await self.send(text_data=json.dumps({
            'notification': notification,
            'sender_id': sender_id,
            'room': room
        }))
        
    async def logout(self, code):
        self.close()
        
    @database_sync_to_async
    def clear_all_user_channels(self, user):
        try:
            user_websocket = UserWebSocket.objects.get(user=user)
            user_websocket.channel_names = []
            user_websocket.save()
        except Exception as e:
            # Handle exception
            pass
