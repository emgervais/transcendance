import json
import uuid

from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from app import pongbackend
from .chat.censor import censor

# import pongbackend

class PongConsumer(WebsocketConsumer):
	pong_group = 'pong_group'
	players = {}

	def connect(self):
		print('connect')
		# pongbackend.pong()
		self.player_id = uuid.uuid1()
		self.player_sid = str(self.player_id)
		self.accept()

		async_to_sync(self.channel_layer.group_add)(
			self.pong_group,
			self.channel_name
		)

		self.send(text_data=json.dumps({
			'type': 'player_id',
			'player_id': self.player_sid
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


class ChatConsumer(WebsocketConsumer):
	def connect(self):
		self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
		self.room_group_name = "chat_%s" % self.room_name
		async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
		self.accept()

	def disconnect(self, close_code):
		async_to_sync(self.channel_layer.group_discard)(
			self.room_group_name, self.channel_name
		)

	def receive(self, text_data):
		text_data_json = json.loads(text_data)
		message = text_data_json['message']
		message = censor(message)
		user = self.scope["user"]
		message = f"{user}: {message}"
		async_to_sync(self.channel_layer.group_send)(
			self.room_group_name, {"type": "chat_message", "message": message}
		)		

	def chat_message(self, event):
		message = event["message"]
		self.send(text_data=json.dumps({"message": message}))