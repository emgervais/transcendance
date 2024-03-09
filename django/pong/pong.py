# from . import pybackend
from .pybackend import pong

import asyncio

class PongInstance:
	websockets = []
	task = None

	def __init__(self):
		self.player = 0

	async def connect(self, send):
		print('connect')
		print(send)
		self.player = pong.new_player()
		self.websockets.append(send)
		self.send = send
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
		if pong.player_count() == 2:
			if self.task != None:
				await self.task
				self.task = None
			print('start game')
			self.task = asyncio.create_task(self.gameloop())

	async def disconnect(self):
		print('disconnect')
		self.websockets.remove(self.send)
		if pong.player_count() < 3:
			for ws in self.websockets:
				print(ws)
				await ws({
					'type': 'websocket.send',
					'bytes': b'\x08\x00'
				})
			if self.task != None:
				self.task.cancel()
				self.task = None
			pong.end_game()
		self.player.remove()

	# def receive(self, bytes_data):
	# 	print('receive')
	# 	print(bytes_data)
	# 	self.player.receive(bytes_data)
	# 	# self.send(bytes_data)

	async def gameloop(self):
		for ws in self.websockets:
			await ws({
				'type': 'websocket.send',
				'bytes': b'\x08\x03'
			})
		pong.start_game()
		print('start game')
		message = {'type': 'websocket.send', 'bytes': ''}
		while pong.player_count() >= 2:
			data = pong.update()
			if len(data) == 0:
				await asyncio.sleep(0.01)
				continue
			# send to and await all websockets
			message['bytes'] = data
			for ws in self.websockets:
				await ws(message)
			await asyncio.sleep(0.01)

async def wsapp(scope, receive, send):
	pi = PongInstance()
	while True:
		event = await receive()
		e = pong.get_event(event, pi.player)
		if e == 0:
			continue
		if e == 1:
			await pi.connect(send)
		elif e == 2:
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
