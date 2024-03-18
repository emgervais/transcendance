# from . import pybackend
from .pybackend import pong
from notification.utils_db import change_status
import threading

import asyncio

class PongInstance:
	games = {}

	def __init__(self, id, playerid):
		if(not (id in self.games)):
			self.games[id] = pong.Pong()
		self.playerid = playerid
		self.id = id
		self.game = self.games[id]
		self.player = None
		self.send = None

	async def connect(self, send):
		print('connect')
		if self.game.player_count() < 2:
			self.player = self.game.new_player(send)
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
			self.game.remove_player(self.player, self.send)
			self.player = None
			self.send = None
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
			self.games.pop(self.id)

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
		while self.game.player_count() >= 2:
			data = self.game.update()
			if len(data) == 0:
				await asyncio.sleep(0.01)
				continue
			# send to and await all websockets
			message['bytes'] = data
			for ws in self.game.websockets:
				await ws(message)
			await asyncio.sleep(0.01)
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
	pi = PongInstance(gameid, user.id)
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
