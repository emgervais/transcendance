import redis
import time
import threading
import json
import signal
import sys
from django.conf import settings
from users.models import UserChannelGroup

matchmaking_redis = redis.StrictRedis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

def get_main_channel(user):
    try:
        user_channel_group = UserChannelGroup.objects.get(user=user)
        return user_channel_group.main
    except UserChannelGroup.DoesNotExist:
        return None

def get_room_name(user_id1, user_id2):
    room_name = ''
    
    if user_id1 < user_id2:
        room_name = f'{user_id1}_{user_id2}'
    else:
        room_name = f'{user_id2}_{user_id1}'
    return room_name

def worker():
    while True:
        users = matchmaking_redis.zrange('global', 0, 1)
        if len(users) == 2:
            matchmaking_redis.zrem('global', users[0], users[1])
            for user in users:
                main_channel = get_main_channel(user)
                if main_channel:
                    room_name = get_room_name(users[0], users[1])
                    main_channel.send(text_data=json.dumps({
                        'type': 'pong',
                        'room': room_name
                    }))
        time.sleep(10)

def signal_handler(sig, frame):
    sys.exit(0)

def start_worker():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    threading.Thread(target=worker).start()