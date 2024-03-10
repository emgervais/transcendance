import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from notification.consumers import get_main_channel, close_websocket
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from users.models import User, UserChannelGroup
from friend.models import Block
from chat.censor import censor

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    
@database_sync_to_async
def is_blocked(user, recipient):
    try:
        return Block.objects.is_blocked(recipient, user) or Block.objects.is_blocked(user, recipient)
    except Block.DoesNotExist:
        return False

# @database_sync_to_async
# def get_all_blocked_user_ids(user):
#     try:
#         blocked_ids = Block.objects.blocked_ids(user)
#         print(blocked_ids)
#         return blocked_ids
#     except Block.DoesNotExist:
#         return []

@database_sync_to_async
def add_channel_group(user, channel_name, group_name):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        user_channel_group.add_channel_group(channel_name, group_name)
    except UserChannelGroup.DoesNotExist:
        UserChannelGroup.objects.create(user=user, channel_groups={channel_name: group_name})

@database_sync_to_async
def remove_channel_group(user, channel_name):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        user_channel_group.remove_channel_group(channel_name)
    except UserChannelGroup.DoesNotExist:
        print(user, "does not have a channel group")
        
@database_sync_to_async
def in_group(user, group_name):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        return user_channel_group.in_group(group_name)
    except UserChannelGroup.DoesNotExist:
        return False

@database_sync_to_async
def get_channel_name(user, group_name):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        return user_channel_group.get_channel_name(group_name)
    except UserChannelGroup.DoesNotExist:
        return None

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
            if self.group_name != 'global':
                await self.private_room(self.user)
            # self.blocked_users = await get_all_blocked_user_ids(self.user)
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
        text_data_json = json.loads(text_data)
        closing = text_data_json.get('closing', False)
        message = text_data_json.get('message', '')

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
        message = censor(event['message'])
        sender_id = event['senderId']
        closing = event.get('closing', False)
        
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
    channel_name = UserChannelGroup.objects.get(user=recipient).get_channel_name(group_name)
    if channel_name:
        async_to_sync(channel_layer.send)(channel_name, {
            'type': 'chat.message',
            'message': 'This user has blocked you',
            'senderId': user.id,
            'closing': True
        })
        close_websocket(channel_layer, channel_name)
    channel_name = UserChannelGroup.objects.get(user=user).get_channel_name(group_name)
    if channel_name:
        close_websocket(channel_layer, channel_name)
        UserChannelGroup.objects.get(user=user).remove_channel_group(channel_name)
    