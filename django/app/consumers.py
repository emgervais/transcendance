import json
import asyncio

from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

import pong

# import pongbackend

class PongConsumer(WebsocketConsumer):
	pong_group = 'pong_group'
	players = []
	playercount = 0
	ponggame = pong.PongGame()

	def connect(self):
		print('connect')
		self.accept()

		async_to_sync(self.channel_layer.group_add)(
			self.pong_group,
			self.channel_name
		)

		self.player = pong.new_player()
		self.players.append(self.player)
		self.playercount += 1
	
		self.send(text_data=json.dumps({
			'type': 'log',
			'message': self.player.id
		}))

	def disconnect(self, close_code):
		print('disconnect')
		self.player.remove()
		self.players.remove(self.player)
		self.playercount -= 1
		async_to_sync(self.channel_layer.group_discard)(
			self.pong_group,
			self.channel_name
		)

	def receive(self, text_data):
		print(text_data)
		self.send(text_data=text_data)

	def gameloop(self):
		while self.playercount > 1:
			self.ponggame.update()
			asyncio.sleep(0.05)
