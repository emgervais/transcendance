from channels.db import database_sync_to_async
# from . import pybackend
from .pybackend import pong
from notification.utils_db import change_status
from users.models import User
from pong.models import Game

import asyncio

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
			self.player = self.game.new_player(send, self.user.id)
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
				self.task = asyncio.create_task(self.gameloop())
				# self.game.task = threading.Thread(target=self.gameloop)
				# self.game.task.start()
				self.game.filthmap[4] = 1
				# print(self.game.update())
		else:
			await send({
				'type': 'websocket.close',
			})

	async def disconnect(self):
		print('disconnect')
		if(self.player != None):
			await update_stats(self.user, self.player, self.game)
		if self.game.player_count() < 2:
			for ws in self.game.websockets:
				await ws({
					'type': 'websocket.send',
					'bytes': b'\x08\x00'
				})
			if self.game.task != None:
				self.game.task.cancel()
				self.game.task = None
			self.game.end_game()
		if(self.game.player_count() == 0):
			PongInstance.games.pop(self.id)

	# def receive(self, bytes_data):
	# 	print('receive')
	# 	print(bytes_data)
	# 	self.player.receive(bytes_data)
	# 	# self.send(bytes_data)

	async def gameloop(self):
		for ws in self.game.websockets:
			await ws({
				'type': 'websocket.send',
				'bytes': b'\x08\x03'
			})
		self.game.start_game()
		message = {'type': 'websocket.send', 'bytes': ''}
		gameended = False
		while self.game.player_count() >= 2:
			data = self.game.update()
			if len(data) == 0:
				await asyncio.sleep(0.01)
				continue
			winner = self.game.is_match_end()
			if(winner != 0):
				gameended = True
				stats = self.game.get_match_stats()

			# send to and await all websockets
			message['bytes'] = data
			for ws in self.game.websockets:
				await ws(message)
			await asyncio.sleep(0.01)
		stats = self.game.get_match_stats()

		print('end game')

async def wsapp(scope, receive, send):
	user = scope['user']
	if(not user.is_authenticated):
		await send({
			'type': 'websocket.close',
		})
		return
	change_status(user, 'in-game')
	gameid = scope['url_route']['kwargs']['gameid']

	pi = PongInstance(gameid, user)
	while True:
		event = await receive()
		e = pong.get_event(event, pi.player, pi.game)
		if e == 0:
			continue
		if e == 1:
			await pi.connect(send)
		elif e == 2:
			change_status(user, 'online')
			await pi.disconnect()
			await send({
				'type': 'websocket.close',
			})
			break
		# ty = event['type']
		# # print(event)
		# if ty == 'websocket.receive':
		# 	pi.receive(event['bytes'])
		# elif ty == 'websocket.connect':
		# 	await pi.connect(send)
		# elif ty == 'websocket.disconnect':
		# 	pi.disconnect()
		# 	await send({
		# 		'type': 'websocket.close',
		# 	})
		# 	break

@database_sync_to_async
def update_stats(user, player, game):
	print("_______update_stats________", user.username)
	user.ball_hit_count += player.ball_hit_count
	if(game.longest_exchange > user.longest_exchange):
		user.longest_exchange = game.longest_exchange
	user.win_count += player.win_count
	user.loss_count += player.loss_count
	user.ball_travel_length += max(0, game.ball_travel_length)
	user.save()