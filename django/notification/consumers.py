from channels.generic.websocket import AsyncWebsocketConsumer
import time, threading, json
from notification.utils import get_opponent_id, user_disconnect, async_send_to_websocket, escape_html, matchmaking_redis
from notification.utils_db import change_status, set_main_channel, get_group_list, get_main_channel, get_online_friends, friend_request_count, get_user, is_recipient_online, remove_channel_group
from pong.matchmaking import matchmaker, next_round

matchmaking_lock = threading.Lock()

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.in_queue = False
        self.current_queue = ''
        self.disconnect_thread = threading.Thread(target=user_disconnect, args=(self.user.id,))
        
        if not self.user.is_authenticated:
            await self.close()
        else:
            if self.user.status == 'offline':
                await change_status(self.user, 'online')
                await self.notify_online_status_to_friends()
            await set_main_channel(self.user, self.channel_name)
            await self.accept()
            await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
                'type': 'send.notification', 'notification': 'friendRequests', 'count': await friend_request_count(self.user)
            })
            await self.reconnect_chats()
    
    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await set_main_channel(self.user, '')
            self.disconnect_thread.start()

    async def receive(self, text_data):
        text_data = escape_html(text_data)
        data = json.loads(text_data)
        type = data['type']

        if type == 'matchmaking':
            await self.handle_matchmaking(data)
        elif type == 'nextGame':
            tournament_id = data.get('tournamentId')
            if tournament_id:
                await self.next_game(tournament_id)
        elif type == 'tournamentCancel':
            tournament_id = data.get('tournamentId')
            if tournament_id:
                matchmaking_redis.zrem(tournament_id, self.user.id)
        
    async def handle_matchmaking(self, data):
        room = data.get('room', 'global')
        
        if data.get('cancel', False):
            if not await self.is_refusing_match(room) and self.in_queue:
                await self.cancel_search()
        else:
            if self.current_queue != room:
                await self.cancel_search()
            await self.search_match(room)
            
    async def next_game(self, tournament_id):
        if self.in_queue:
            await self.cancel_search()
        matchmaking_redis.zadd(tournament_id, {self.user.id: time.time()})
        self.in_queue = True
        self.current_queue = tournament_id
        if not matchmaking_lock.locked():
            with matchmaking_lock:
                threading.Thread(target=next_round, args=(tournament_id,)).start()
        
    async def websocket_close(self, event):
        await self.close()
    
    async def send_notification(self, event):
        params = event
        params['type'] = params.pop('notification')
        params['onlineFriendIds'] = await get_online_friends(self.user, ids_only=True)
        if params['type'] == 'connection':
            if params['status'] == 'offline' and params['userId'] in params['onlineFriendIds']:
                params['onlineFriendIds'].remove(params['userId'])    
            elif params['status'] == 'online' and params['userId'] not in params['onlineFriendIds']:
                params['onlineFriendIds'].append(params['userId'])    
        
        await self.send(text_data=json.dumps(params))
        if params['type'] == 'matchFound':
            self.in_queue = False
        elif params['type'] == 'matchRefused':
            await self.cancel_search()
    
    async def reconnect_chats(self):
        await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
            'type': 'send.notification', 'notification': 'chat', 'room': 'global'
        })
        group_list = await get_group_list(self.user)
        if group_list:
            for group in group_list:
                if group != 'global' and not group.startswith("pong"):
                    if await is_recipient_online(self.user.id, group):
                        await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
                            'type': 'send.notification', 'notification': 'chat', 'room': group
                        })
                    else:
                        remove_channel_group(self.user, group)
    
    async def notify_online_status_to_friends(self, status='online'):
        friends = await get_online_friends(self.user)
        if friends:
            for friend in friends:
                await async_send_to_websocket(self.channel_layer, await get_main_channel(friend), {
                    'type': 'send.notification', 'notification': 'connection', 'status': status, 'userId': self.user.id
                })

    async def search_match(self, room):
        if room != 'global' and room != 'tournament':
            if not await self.send_match_request(room):
                return
        await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
            'type': 'send.notification', 'notification': 'pong', 'description': 'searchingMatch', 'room': room
        })
        matchmaking_redis.zadd(room, {self.user.id: time.time()})
        self.in_queue = True
        self.current_queue = room
        if not matchmaking_lock.locked():
            with matchmaking_lock:
                threading.Thread(target=matchmaker, args=(room,)).start()

    async def cancel_search(self):
        matchmaking_redis.zrem(self.current_queue, self.user.id)
        self.in_queue = False
        self.current_queue = ''
        
    async def is_refusing_match(self, room):
        if room != 'global' and room != 'tournament':
            opponent_id = await get_opponent_id(room, self.user.id)
            if opponent_id and matchmaking_redis.zrank(room, opponent_id) is not None:
                await async_send_to_websocket(self.channel_layer, await get_main_channel(opponent_id, True), {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'matchRefused', 'room': room
                })
                matchmaking_redis.zrem(room, opponent_id)
                return True
        return False
    
    async def send_match_request(self, room):
        opponent_id = await get_opponent_id(room, self.user.id)
        opponent = await get_user(opponent_id)
        if opponent:
            if opponent.status == 'online':
                if matchmaking_redis.zrank(room, opponent_id) is None:
                    await async_send_to_websocket(self.channel_layer, await get_main_channel(opponent_id, True), {
                        'type': 'send.notification',
                        'notification': 'pong',
                        'description': 'matchRequest',
                        'room': room,
                        'userId': self.user.id
                    })
                return True
            elif opponent.status == 'in-game':
                await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'opponentInGame', 'userId': opponent_id,
                })
            else:
                await async_send_to_websocket(self.channel_layer, await get_main_channel(self.user), {
                    'type': 'send.notification', 'notification': 'pong', 'description': 'opponentOffline', 'userId': opponent_id,
                })
        return False
    
