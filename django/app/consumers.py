import json
import uuid

from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

import pong

# import pongbackend

class PongConsumer(WebsocketConsumer):
	pong_group = 'pong_group'
	players = {}

	def connect(self):
		print('connect')
		self.accept()

		async_to_sync(self.channel_layer.group_add)(
			self.pong_group,
			self.channel_name
		)

		self.send(text_data=json.dumps({
			'type': 'log',
			'message': 'connected'
		}))

	def disconnect(self, close_code):
		print('disconnect')
		async_to_sync(self.channel_layer.group_discard)(
			self.pong_group,
			self.channel_name
		)

	def receive(self, text_data):
		print(text_data)
		self.send(text_data=text_data)
