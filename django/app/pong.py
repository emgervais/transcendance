players = []

import pong

import asyncio

class PongInstance:
	websockets = []
	task = None

	def __init__(self):
		self.player = 0

	async def connect(self, send):
		print('connect')
		self.player = pong.new_player()
		self.websockets.append(send)
		self.send = send
		await send({
				'type': 'websocket.accept',
			})
		
		if pong.player_count() == 2:
			if self.task != None:
				await self.task
				self.task = None
			self.task = asyncio.create_task(self.gameloop())
		
		if self.player.pongid == 1:
			await send({
				'type': 'websocket.send',
				'bytes': b'\x05\x01'
			})
		elif self.player.pongid == 2:
			await send({
				'type': 'websocket.send',
				'bytes': b'\x05\x02'
			})
		else:
			await send({
				'type': 'websocket.send',
				'bytes': b'\x05\x00'
			})

	def disconnect(self):
		print('disconnect')
		self.player.remove()
		self.websockets.remove(self.send)
		if pong.player_count() < 2 and self.task != None:
			self.task.cancel()
			self.task = None
			pong.end_game()

	# def receive(self, bytes_data):
	# 	print('receive')
	# 	print(bytes_data)
	# 	self.player.receive(bytes_data)
	# 	# self.send(bytes_data)

	async def gameloop(self):
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
			pi.disconnect()
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
		