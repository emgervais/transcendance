import json
import uuid

from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# import pongbackend

class PongConsumer(WebsocketConsumer):
	pong_group = 'pong_group'
	players = {}

	def connect(self):
		self.player_id = str(uuid.uuid4())
		self.accept()

		async_to_sync(self.channel_layer.group_add)(
			self.pong_group,
			self.channel_name
		)

		self.send(text_data=json.dumps({
			'type': 'player_id',
			'player_id': self.player_id
		}))

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.pong_group,
			self.channel_name
		)

	def receive(self, text_data):
		text_data_json = json.loads(text_data)

