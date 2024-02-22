import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name
        
        print(user)
        if not user.is_authenticated:
            await self.close()
        else:
            # Join room group
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.save_channel_name(user, self.channel_name)
            await self.change_status(user, 'online')
            await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        user = self.scope["user"]
        if user.is_authenticated:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            await self.change_status(user, 'offline')

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
        
    # Leave all groups when the user logs out
    async def logout(self, event):
        await self.close()
    
    # save channel name to user model
    @database_sync_to_async
    def save_channel_name(self, user, channel_name):
        user.channel_name = channel_name
        user.save()
        
    @database_sync_to_async
    def change_status(self, user, status):
        user.status = status
        user.save()