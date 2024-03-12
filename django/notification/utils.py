from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from users.models import UserChannelGroup
from friend.models import Friend
from users.models import User
import time

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
                notify_online(user, friend, False, channel_layer)
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

async def get_opponent_id(room, user_id):
    users = room.split('_')
    return users[0] if users[0] != str(user_id) else users[1]

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
                'type': 'send.notification',
                'notification': 'friendRequest',
                'userId': user_id,
                'id': friend_request_id
            })
    except UserChannelGroup.DoesNotExist:
        print('Friend channel group not found')
    except Exception as e:
        print('Error:', e)
        
def accept_friend_request_notify(user, friend):
    channel_layer = get_channel_layer()
    if friend.status == 'online':
        notify_online(user, friend, True, channel_layer)
    if user.status == 'online':
        notify_online(friend, user, True, channel_layer)
        
def notify_online(user, friend, connected, channel_layer):
    try:
        channel_name = UserChannelGroup.objects.get(user=friend).main
        if channel_name:
            async_to_sync(channel_layer.send)(channel_name, {
                'type': 'send.notification',
                'notification': 'connection',
                'connected': connected,
                'userId': user.id
            })
    except UserChannelGroup.DoesNotExist:
        print('Friend channel group not found')
    except Exception as e:
        print('Error:', e)