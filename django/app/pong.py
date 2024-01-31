players = []

import pong

import asyncio

class PongInstance:
	websockets = []
	playercount = 0
	ponggame = pong.PongGame()

	async def connect(self, send):
		print('connect')
		if(self.playercount >= 2):
			return
		self.player = pong.new_player()
		self.playercount += 1
		self.websockets.append(send)
		self.websocket = send
		await send({
				'type': 'websocket.accept',
			})

	def disconnect(self):
		print('disconnect')
		self.player.remove()
		self.playercount -= 1
		self.websockets.remove(self.websocket)

	async def receive(self, bytes_data):
		self.player.receive(bytes_data)
		self.websocket(bytes_data)
	
	async def gameloop(self):
		while True:
			while self.playercount >= 2:
				data = await self.ponggame.update()
				# send to and await all websockets
				asyncio.gather(*[ws(data) for ws in self.websockets])
			await asyncio.sleep(0.1)

async def ws_application(scope, receive, send):
	pi = PongInstance()
	pi.gameloop()
	while True:
		event = await receive()
		ty = event['type']
		# print(event)
		if ty == 'websocket.receive':
			await pi.receive(event['bytes'])
		elif ty == 'websocket.connect':
			await pi.connect(send)
		elif ty == 'websocket.disconnect':
			pi.disconnect()
			await send({
				'type': 'websocket.close',
			})
			break
		