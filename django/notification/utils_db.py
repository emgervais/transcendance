from channels.db import database_sync_to_async
from users.models import User, UserChannelGroup
from friend.models import Block
from friend.models import Friend

# Database operations for the consumers
@database_sync_to_async
def change_status(user, status):
    user.status = status
    user.save()

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
def get_main_channel(user, id=False):
    try:
        if id:
            return UserChannelGroup.objects.get(user__id=user).main
        return UserChannelGroup.objects.get(user=user).main
    except UserChannelGroup.DoesNotExist:
        return None
    
@database_sync_to_async
def get_online_friends(user, ids_only=False):
    try:
        friends = Friend.objects.online_friends(user, ids_only)
        return friends
    except Exception as e:
        print('Error:', e)

@database_sync_to_async
def friend_request_count(user):
    try:
        return Friend.objects.requests(user).count()
    except Exception:
        return 0
    
@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None

@database_sync_to_async
def update_swear_count(user, new_count):
    user.swear_count += new_count
    user.save()
    
@database_sync_to_async
def is_blocked(user, recipient):
    try:
        return Block.objects.is_blocked(recipient, user) or Block.objects.is_blocked(user, recipient)
    except Block.DoesNotExist:
        return False

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
    
@database_sync_to_async
def is_recipient_online(user_id, group):
    users = group.split('_')
    recipient_id = users[0] if users[0] != str(user_id) else users[1]
    try:
        return User.objects.get(id=recipient_id).status == 'online'
    except User.DoesNotExist:
        return False
    
@database_sync_to_async
def is_opponent_in_game(user_id, group):
    user_ids = group.sub('game_', '').split('_')
    opponent_id = user_ids[0] if user_ids[0] != str(user_id) else user_ids[1]
    try:
        return UserChannelGroup.objects.get(user__id=opponent_id).in_group(group)
    except UserChannelGroup.DoesNotExist:
        return False