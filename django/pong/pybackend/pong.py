import time
import math
from channels.db import database_sync_to_async
from pong.models import Game

SCREEN_LENGTH = 13.65
ENDIENESS = 'little'
BALL_PRECISION = 1000.0
POINTS_TO_WIN = 2

# P1Y = 1, P2Y = 2, P1Score = 4, P2Score = 8, Ball = 16, PWin = 32, Count = 64
# 00000001, 00000010, 00000100, 00001000, 00010000, 00100000, 01000000

FILT_CLEAR = 0b00000000
FILT_INIT = 0b01011100

class Events:
	player_movement = 1
	player_score = 2
	ball_hit = 3

class Ball:
	def __init__(self):
		self.x = 0.0
		self.y = 0.0
		self.vx = 0.0
		self.vy = 0.0
		self.lasthit = 0

class Player:
	def __init__(self, userid):
		self.userid = userid
		self.score = 0
		self.y = 0
		self.pongid = 0
		self.ball_hit_count = 0
		self.disconnected = False

class Pong:
	def __init__(self):
		self.starttime = 0
		self.duration = 0
		self.countdown = 0
		self.filter: bytes = FILT_CLEAR
		self.pbplayers = []
		self.player1 = 0
		self.player2 = 0
		self.longest_exchange = 0
		self.curr_exchange_length = 0
		self.total_exchanges = 0
		self.total_distance = SCREEN_LENGTH / 2
		self.ball = Ball()
		self.websockets = []
		self.task = None

	def player_count(self) -> int:
		return len(self.pbplayers)

	def start_game(self):
		self.ball.x = 39
		self.ball.y = 26.5
		self.ball.vx = -0.03
		self.ball.vy = 0
		self.filter = FILT_INIT
		self.player1.score = 0
		self.player2.score = 0
		self.lasthit = 1
		self.countdown = 3
		self.starttime = time.time()

	def new_player(self, send, id) -> Player:
		player = Player(id)
		self.pbplayers.append(player)
		self.websockets.append(send)
		if(self.player1 == 0):
			self.player1 = player
			player.pongid = 1
		elif(self.player2 == 0):
			self.player2 = player
			player.pongid = 2
		return player

	@database_sync_to_async
	def save_game(self):
		self.duration = time.time() - self.starttime
		game = Game()
		game.winner = self.player1.userid if self.player1.score > self.player2.score else self.player2.userid
		game.loser = self.player1.userid if self.player1.score < self.player2.score else self.player2.userid
		game.score = [self.player1.score, self.player2.score] if self.player1.score > self.player2.score else [self.player2.score, self.player1.score]
		game.duration = self.duration
		game.longest_exchange = self.longest_exchange
		game.total_exchanges = self.total_exchanges
		game.total_distance = self.total_distance
		game.save()

	def calculate_distance(self):
		angle = math.atan2(self.ball.vy, self.ball.vx)
		distance = abs(SCREEN_LENGTH / math.cos(angle))
		self.total_distance += distance
		# print('angle:', angle, 'distance:', distance, 'total distance:', self.total_distance)

	def calculate_direction(self, offset, bytestr: bytes):
		self.calculate_distance()
		self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], ENDIENESS, signed=True) / BALL_PRECISION
		self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], ENDIENESS, signed=True) / BALL_PRECISION
		self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], ENDIENESS, signed=True) / BALL_PRECISION
		self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], ENDIENESS, signed=True) / BALL_PRECISION
		self.filter |= 16
		return offset + 16

	def receive(self, bytestr: bytes, player):
		if(player == None or player.pongid > 2 or player.pongid < 1):
			return
		offset = 0
		while(offset < len(bytestr)):
			type = bytestr[offset] 
			offset += 1
			if(type == Events.player_movement):
				player.y = int.from_bytes(bytestr[offset:(offset + 4)], ENDIENESS)
				self.filter |= 1 << (player.pongid - 1)
				offset += 4
			elif(type == Events.player_score):
				self.curr_exchange_length = 0
				if(player.pongid == 1):
					pplayer = self.player2
				else:
					pplayer = self.player1
				pplayer.score += 1
				self.filter |= 1 << (pplayer.pongid + 1)
				offset = self.calculate_direction(offset, bytestr)
				if(pplayer.score >= POINTS_TO_WIN and not self.filter & 32):
					self.filter |= 32
			elif(type == Events.ball_hit):
				self.ball.lasthit = player.pongid
				player.ball_hit_count += 1
				self.curr_exchange_length += 1
				self.total_exchanges += 1
				self.longest_exchange = max(self.longest_exchange, self.curr_exchange_length)
				offset = self.calculate_direction(offset, bytestr)
			else:
				offset = len(bytestr)
 
	def get_countdown(self):
		timediff = math.ceil(3 - (time.time() - self.starttime) * 0.8)
		if timediff < 0:
			self.filter &= ~64
			return 0
		return timediff

	def update(self) -> bytes:
		if len(self.pbplayers) < 2:
			return b''
		
		bytestr = b''
		flag_map = {
			1: (b'\x01', self.player1.y),
			2: (b'\x02', self.player2.y),
			4: (b'\x03', self.player1.score),
			8: (b'\x04', self.player2.score),
			16: (b'\x05', (self.ball.lasthit, self.ball.x, self.ball.y, self.ball.vx, self.ball.vy)),
			32: (b'\x08\x04', 1 if self.player1.score > self.player2.score else 2),
			64: (b'\x08\x05', self.get_countdown() if self.filter & 64 else 0)
		}
		for flag, (byte_prefix, data) in flag_map.items():
			if self.filter & flag:
				bytestr += byte_prefix
				if isinstance(data, int):
					bytestr += data.to_bytes(4, ENDIENESS)
				elif isinstance(data, tuple):
					bytestr += data[0].to_bytes(1, ENDIENESS, signed=True)
					bytestr += int(data[1] * BALL_PRECISION).to_bytes(4, ENDIENESS, signed=True)
					bytestr += int(data[2] * BALL_PRECISION).to_bytes(4, ENDIENESS, signed=True)
					bytestr += int(data[3] * BALL_PRECISION).to_bytes(4, ENDIENESS, signed=True)
					bytestr += int(data[4] * BALL_PRECISION).to_bytes(4, ENDIENESS, signed=True)
		self.filter &= 64
		return bytestr

	def end_game(self):
		self.ball.x = 0
		self.ball.y = 0
		self.ball.vx = 0
		self.ball.vy = 0
		self.filter |= 16
		self.pbplayers = []
		self.websockets = []
		self.player1 = 0
		self.player2 = 0
		return

	def remove_player(self, player, send):
		if(player == self.player1):
			self.player1 = 0
		elif(player == self.player2):
			self.player2 = 0
		self.pbplayers.remove(player)
		self.websockets.remove(send)

def get_event(event, player, game):
	type = event['type']
	if(type[0] == 'w'):
		if(type[10] == 'r'):
			game.receive(event['bytes'], player)
		elif(type[10] == 'c'):
			return 1
		elif(type[10] == 'd'):
			return 2
	return 0
