from .pybackend import pong
from channels.generic.websocket import AsyncWebsocketConsumer
from users.models import UserChannelGroup
from channels.layers import get_channel_layer
import time, threading, redis, json
from django.conf import settings
from notification.utils_db import change_status, add_channel_group, remove_channel_group, get_main_channel, get_channel_name, is_opponent_in_game
from notification.utils import send_to_websocket
import asyncio

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if not self.user.is_authenticated:
            await self.close()
        else:
            self.group_name = self.scope['url_route']['kwargs']['room_name']
            await self.accept()
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await add_channel_group(self.user, self.channel_name, self.group_name)
            if await is_opponent_in_game(self.user.id, self.group_name) and self.user.status != 'in-game':
                change_status(self.user, 'in-game')
                await self.channel_layer.group_send(
                    self.group_name,
					{
						'type': 'game.start',
					}
				)
            print('connected')
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        
    # async def game_start(self, event):
    #     await self.send({}

    # async def gameloop(self):
    #     for ws in self.websockets:
    #         await ws({
    #             'type': 'websocket.send',
    #             'bytes': b'\x08\x03'
    #         })
    #     pong.start_game()
    #     print('start game')
    #     message = {'type': 'websocket.send', 'bytes': ''}
    #     while pong.player_count() >= 2:
    #         data = pong.update()
    #         if len(data) == 0:
    #             await asyncio.sleep(0.01)
    #             continue
    #         # send to and await all websockets
    #         message['bytes'] = data
    #         for ws in self.websockets:
    #             await ws(message)
    #         await asyncio.sleep(0.01)
            

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
        #     pi.receive(event['bytes'])
        # elif ty == 'websocket.connect':
        #     await pi.connect(send)
        # elif ty == 'websocket.disconnect':
        #     pi.disconnect()
        #     await send({
        #         'type': 'websocket.close',
        #     })
        #     break
