import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from users.models import User
from chat.censor import censor
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from typing import List

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        
        if not user.is_authenticated:
            await self.close()
        else:
            self.room_name = self.scope['url_route']['kwargs']['room_name']
            if self.room_name == 'main':
                await self.change_status(user, 'online')
                await self.save_main_channel_name(user, self.channel_name)
                
            self.room_group_name = 'chat_%s' % self.room_name
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        user = self.scope["user"]
        if user.is_authenticated:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            if self.room_name == 'main':
                await self.save_main_channel_name(user, '')
            await self.change_status(user, 'offline')

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        user = self.scope["user"]
        message = f"{user}: {message}"
        recipients = self.room_name.split('_') if '_' in self.room_name else [self.room_name]


        missing_recipients = await self.are_recipients_in_group(recipients)
        group_members = await self.get_group_members(self.room_group_name)
        print(f"Group members: {group_members}")
        if missing_recipients:
            print(f"Missing recipients: {missing_recipients}")
            # Send notification to main WebSocket connections of missing recipients
            for recipient_id in missing_recipients:
                await self.send_notification(recipient_id, message, self.room_name, user.id)
            return

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
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

    async def send_notification(self, recipient_id, message, room_name, sender_id):
        # Get the user instance for the recipient
        recipient = await self.get_user(recipient_id)
        if recipient and recipient.main_channel_name:
            # Send a notification to the main WebSocket connection of the recipient
            channel_layer = get_channel_layer()
            await channel_layer.send(
                recipient.main_channel_name,
                {
                    'type': 'notification',
                    'message': message,
                    'room_name': room_name,
                    'sender_id': sender_id,
                }
            )
            
    async def notification(self, event):
        message = event['message']
        room_name = event['room_name']
        sender_id = event['sender_id']
        await self.send(text_data=json.dumps({
            'message': message,
            'room_name': room_name,
            'sender_id': sender_id
        }))
        
    async def logout(self):
        await self.close()

    @database_sync_to_async
    def are_recipients_in_group(self, recipients):
        # Check if recipients are part of the group
        missing_recipients = []
        for recipient_id in recipients:
            recipient = User.objects.filter(pk=recipient_id).first()
            if not recipient:
                missing_recipients.append(recipient_id)
        return missing_recipients
    
    async def get_group_members(self, group_name):
        # Asynchronously retrieve the list of channel names in the group
        channel_layer = get_channel_layer()
        group_members = await channel_layer.group_channels(group_name)
        return group_members
    
    
    @database_sync_to_async
    def save_main_channel_name(self, user, channel_name):
        user.main_channel_name = channel_name
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