players = []

import pong

import asyncio

class PongInstance:
	websockets = []
	ponggame = pong.PongGame()

	async def connect(self, send):
		print('connect')
		if(self.playercount >= 2):
			return
		self.player = pong.new_player()
		self.websockets.append(send)
		self.send = send
		await send({
				'type': 'websocket.accept',
			})

	def disconnect(self):
		print('disconnect')
		self.player.remove()
		self.playercount -= 1
		self.websockets.remove(self.send)

	def receive(self, bytes_data):
		self.player.receive(bytes_data)
		self.send(bytes_data)
	
	async def gameloop(self):
		while True:
			while self.playercount >= 2:
				data = await self.ponggame.get_data()
				# send to and await all websockets
				asyncio.gather(*[send(data) for send in self.websockets])
			await asyncio.sleep(0.1)

async def ws_application(scope, receive, send):
	pi = PongInstance()
	while True:
		event = await receive()
		ty = event['type']
		# print(event)
		if ty == 'websocket.receive':
			pi.receive(event['bytes'])
		elif ty == 'websocket.connect':
			await pi.connect(send)
		elif ty == 'websocket.disconnect':
			pi.disconnect()
			await send({
				'type': 'websocket.close',
			})
			break
		