import asyncio
import os
import signal

import websockets

class PongConsumer:
    def __init__(self):
        self.players = set()
  
    async def connect(self, websocket):
        self.players.add(websocket)
        await self.send_all("New player joined")

    async def disconnect(self, websocket):
        self.players.remove(websocket)
        await self.send_all("Player left")
        
    async def receive(self, websocket, message):
        await self.send_all(message)
        
    async def send_all(self, message):
        for player in self.players:
            await player.send(message)
            
    async def run():
        loop = asyncio.get_running_loop()
        stop = loop.create_future()
        loop.add_signal_handler(signal.SIGINT, stop.set_result, None)
        loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)

        connection = PongConsumer()
        async with websockets.unix_serve(
            connection.connect,
            path=f"{os.environ['SUPERVISOR_PROCESS_NAME']}.sock",
        ):
            await stop
            
        for player in connection.players:
            await player.close()
            
        await connection.disconnect()
