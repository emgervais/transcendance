import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import User
from chat.censor import censor

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]

        if not user.is_authenticated:
            await self.close()
        else:
            self.room_id = 'global'
            self.room_name = f'chat_{self.room_id}'
            await self.channel_layer.group_add(
                self.room_name,
                self.channel_name
            )
            await self.save_channel_name(user, self.channel_name)
            await self.change_status(user, 'online')
            await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        user = self.scope["user"]
        if user.is_authenticated:
            await self.change_status(user, 'offline')
            await self.save_channel_name(user, None)
            await self.leave_room(self.room_id)
                
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope["user"]
        message = f"{user}: {message}"
        room_id = text_data_json['room_id']

        await self.join_room(room_id)
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': user.id
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']
        
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id
        }))
    
    async def join_room(self, room_id):
        self.room_name = f'chat_{room_id}'
        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )

    async def leave_room(self, room_id):
        self.room_name = f'chat_{room_id}'
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )
    
    async def logout(self, event):
        await self.close()
    
    @database_sync_to_async
    def save_channel_name(self, user, channel_name):
        user.channel_name = channel_name
        user.save()
        
    @database_sync_to_async
    def change_status(self, user, status):
        user.status = status
        user.save()
        
    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
        