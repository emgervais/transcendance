# from . import pybackend
from .pybackend import pong
from notification.utils_db import change_status
import asyncio
from notification.utils import async_send_to_websocket, notify_online
from friend.models import Friend
from notification.utils_db import get_main_channel
from channels.layers import get_channel_layer
from pong.matchmaking import matchmaking_redis
from channels.db import database_sync_to_async

@database_sync_to_async
def notify_status_to_friends(user, status):
	friends = Friend.objects.online_friends(user)
	if friends:
		channel_layer = get_channel_layer()
		for friend in friends:
			if friend.status == 'online':
				notify_online(user, friend, status, channel_layer)

async def game_stopped_notification(user_ids, description):
	channel_layer = get_channel_layer()
	tournament_id = '_'.join(user_ids) + '_1'
	if matchmaking_redis.exists(tournament_id):
		matchmaking_redis.delete(tournament_id)
	for user_id in user_ids:
		try:
			channel_name = await get_main_channel(user_id, id=True)
			await async_send_to_websocket(channel_layer, channel_name, {
				'type': 'send.notification', 'notification': 'pong', 'description': description
			})
		except Exception as e:
			print({'error': str(e)})

class PongInstance:
	games = {}

	def __init__(self, id, user):
		if(not (id in PongInstance.games)):
			PongInstance.games[id] = pong.Pong()
		self.user = user
		self.id = id
		self.game = PongInstance.games[id]
		self.player = None
		self.send = None

	async def connect(self, send):
		print('connect')
		if self.game.player_count() < 2:
			self.player = self.game.new_player(send, self.user)
			self.send = send
			print('player count: ' + str(self.game.player_count()))
			await send({
					'type': 'websocket.accept',
				})
			if self.player.pongid == 1:
				await send({
					'type': 'websocket.send',
					'bytes': b'\x08\x01'
				})
			elif self.player.pongid == 2:
				await send({
					'type': 'websocket.send',
					'bytes': b'\x08\x02'
				})
			else:
				await send({
					'type': 'websocket.send',
					'bytes': b'\x08\x00'
				})
			if self.game.player_count() == 2:
				print('start game')
				self.game.task = asyncio.create_task(self.gameloop())
				self.game.filter |= 16
		else:
			print('game full')
			await send({
				'type': 'websocket.close',
			})

	async def disconnect(self):
		if not self.game.ended and not self.game.notification_sent:
			self.game.notification_sent = True
			user_ids = self.id.split('_')
			description = 'gameStopped'
			if self.game.tournament_user_ids:
				user_ids = self.game.tournament_user_ids
				description = 'tournamentStopped'
			await game_stopped_notification(user_ids, description)
		try:
			if(self.player):
				self.player.disconnected = True
			print('disconnect')
			if(self.game.task != None):
				print('cancel task')
				for ws in self.game.websockets:
					await ws({
						'type': 'websocket.send',
						'bytes': b'\x08\x00'
					})
					await ws({
						'type': 'websocket.close',
					})
				self.game.task.cancel()
				self.game.task = None
				self.game.end_game()
				PongInstance.games.pop(self.id)
			# if(self.game.player1.disconnected and self.game.player2.disconnected):
		except Exception as e:
			print({'error': str(e)})

	async def gameloop(self):
		for ws in self.game.websockets:
			await ws({
				'type': 'websocket.send',
				'bytes': b'\x08\x03'
			})
		self.game.start_game()
		message = {'type': 'websocket.send', 'bytes': ''}
		while self.game.player_count() >= 2:
			data = self.game.update()
			if len(data) == 0:
				await asyncio.sleep(0.01)
				continue
			if self.game.filter & 32:
				await self.game.save_game()
				self.game.filter &= ~32
			# send to and await all websockets
			message['bytes'] = data
			for ws in self.game.websockets:
				await ws(message)
			await asyncio.sleep(0.01)

async def wsapp(scope, receive, send):
	user = scope['user']
	if(not user.is_authenticated):
		await send({
			'type': 'websocket.close',
		})
		return
	change_status(user, 'in-game')
	notify_status_to_friends(user, 'in-game')
	gameid = scope['url_route']['kwargs']['gameid']

	pi = PongInstance(gameid, user)
	while True:
		event = await receive()
		e = pong.get_event(event, pi.player, pi.game)
		# print(e, event)
		if e == 0:
			continue
		if e == 1:
			await pi.connect(send)
		elif e == 2:
			change_status(user, 'online')
			notify_status_to_friends(user, 'online')
			await pi.disconnect()
			await send({
				'type': 'websocket.close',
			})
			break