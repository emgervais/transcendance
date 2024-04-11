from notification.utils_db import get_user, in_group, add_channel_group, remove_channel_group, get_main_channel, is_blocked, update_swear_count, get_channel_name
from notification.utils import notify_online, send_to_websocket, escape_html
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from users.models import UserChannelGroup
from chat.censor import censor
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
        else:
            self.group_name = self.scope['url_route']['kwargs']['room_name']
            if await in_group(self.user, self.group_name):
                old_channel = await get_channel_name(self.user, self.group_name)
                await remove_channel_group(self.user, old_channel)
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await add_channel_group(self.user, self.channel_name, self.group_name)
            if self.group_name != 'global' and not self.group_name.startswith('pong_'):
                await self.private_room(self.user)
            await self.accept()
            
    
    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
    async def websocket_close(self, event):
        await self.close()
        
    async def receive(self, text_data):
        text_data = escape_html(text_data)
        text_data = json.loads(text_data)
        
        closing = text_data.get('closing', False)
        message = text_data.get('message', '')

        await self.channel_layer.group_send(
            self.group_name,
            {
                'type': 'chat.message',
                'message': message,
                'senderId': self.user.id,
                'closing': closing
            }
        )

    async def chat_message(self, event):
        sender_id = event['senderId']
        sender = await get_user(sender_id)
        message, swear_count = censor(event['message'])
        if sender == self.user:
            await update_swear_count(sender, swear_count)
        closing = event.get('closing', False)

        if not await is_blocked(self.user, sender):
            await self.send(text_data=json.dumps({
                'message': message,
                'senderId': sender_id
            }), close=closing)
        if closing:
            await remove_channel_group(self.user, self.channel_name)
        
    async def private_room(self, user):
        recipient_ids = self.group_name.split('_')
        
        if len(recipient_ids) == 2:
            recipient_id = recipient_ids[0] if recipient_ids[0] != str(user.id) else recipient_ids[1]
            recipient = await get_user(recipient_id)
            if recipient and recipient.status == 'online' and not await is_blocked(user, recipient):
                if not await in_group(recipient, self.group_name):
                    recipient_channel = await get_main_channel(recipient)
                    if recipient_channel:
                        await self.channel_layer.send(recipient_channel, {
                            'type': 'send.notification',
                            'notification': 'chat',
                            'room': self.group_name
                        })
            else:
                await self.close()
        else:
            await self.close()
            

def close_blocked_user_chat(user, recipient):
    group_name = '_'.join(sorted([str(user.id), str(recipient.id)]))
    channel_layer = get_channel_layer()
    close_chat(user, recipient, group_name, channel_layer)
    close_chat(recipient, user, group_name, channel_layer)
        
def close_chat(user, recipient, room, channel_layer):
    notify_online(user, recipient, False, channel_layer)
    channel_name = UserChannelGroup.objects.get(user=recipient).get_channel_name(room)
    if channel_name:
        send_to_websocket(channel_layer, channel_name, {'type': 'websocket.close'})
        UserChannelGroup.objects.get(user=recipient).remove_channel_group(channel_name)