import time
import math

endieness = 'little'

ballprecision = 1000.0

winpoints = 10

class Stats:
	def __init__(self):
		self.winner = 0
		self.winnerpoints = 0
		self.loser = 0
		self.loserpoints = 0

class Filths:
	P1Y = 0
	P2Y = 1
	P1Score = 2
	P2Score = 3
	Ball = 4
	PWin = 5
	Count = 6

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
		self.win_count = 0
		self.loss_count = 0

class Pong:
	def __init__(self):
		self.starttime = 0
		self.countdown = 0
		self.filthmap = [0,0,0,0,0,0,0]
		self.pbplayers = []
		self.player1 = 0
		self.player2 = 0
		self.longest_exchange = 0
		self.curr_exchange_length = 0
		self.ball_travel_length = -.5
		self.ball = Ball()
		self.websockets = []
		self.task = None

	def player_count(self) -> int:
		return len(self.pbplayers)

	def start_game(self):
		print('start game')
		self.filthmap = [0 for _ in self.filthmap]
		self.ball.x = 39
		self.ball.y = 26.5
		self.ball.vx = -0.03
		self.ball.vy = 0
		self.filthmap[Filths.Ball] = 1
		self.player1.score = 0
		self.player2.score = 0
		self.lasthit = 1
		self.filthmap[Filths.P1Score] = 1
		self.filthmap[Filths.P2Score] = 1
		self.filthmap[Filths.P1Y] = 0
		self.filthmap[Filths.P2Y] = 0
		self.countdown = 3
		self.starttime = time.time()
		self.filthmap[Filths.Count] = 1

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

	def is_match_end(self):
		if(self.player1.score >= winpoints):
			return 1
		elif(self.player2.score >= winpoints):
			return 2
		return 0

	def get_match_stats(self):
		stats = Stats()
		if(self.player1.score > self.player2.score):
			stats.winner = self.player1.userid
			stats.winnerpoints = self.player1.score
			stats.loser = self.player2.userid
			stats.loserpoints = self.player2.score
		else:
			stats.winner = self.player2.userid
			stats.winnerpoints = self.player2.score
			stats.loser = self.player1.userid
			stats.loserpoints = self.player1.score
		return stats

	def receive(self, bytestr: bytes, player):
		global endieness
		global ballprecision
		# 1: player movement, 2: player score, 3: ball hit
		if(player == None or player.pongid > 2 or player.pongid < 1):
			return
		offset = 0
		while(offset < len(bytestr)):
			type = bytestr[offset]
			offset += 1
			if(type == Events.player_movement):
				player.y = int.from_bytes(bytestr[offset:(offset + 4)], endieness)
				self.filthmap[player.pongid - 1] = 1
				offset += 4
			elif(type == Events.player_score):
				self.ball_travel_length += 1
				self.curr_exchange_length = 0
				pplayer = 0
				if(player.pongid == 1):
					pplayer = self.player2
				else:
					pplayer = self.player1
				pplayer.score += 1
				print("player score: " + str(pplayer.pongid))
				self.filthmap[pplayer.pongid + 1] = 1
				self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness, signed=True) / ballprecision
				self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness, signed=True) / ballprecision
				self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness, signed=True) / ballprecision
				self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness, signed=True) / ballprecision
				self.filthmap[Filths.Ball] = 1
				offset += 16
				if(pplayer.score >= winpoints and not self.filthmap[Filths.PWin]):
					self.filthmap[Filths.PWin] = pplayer.pongid
			elif(type == Events.ball_hit):
				self.ball_travel_length += 1
				self.ball.lasthit = player.pongid
				player.ball_hit_count += 1
				self.curr_exchange_length += 1
				if self.curr_exchange_length > self.longest_exchange:
					self.longest_exchange = self.curr_exchange_length
				self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness, signed=True) / ballprecision
				self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness, signed=True) / ballprecision
				self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness, signed=True) / ballprecision
				self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness, signed=True) / ballprecision
				self.filthmap[Filths.Ball] = 1
				offset += 16
			else:
				offset = len(bytestr)

	def update(self) -> bytes:
		global endieness
		global ballprecision
		if(len(self.pbplayers) < 2):
			return b''
		bytestr = b''
		if(self.countdown > 0):
			timediff = math.ceil(3 - (time.time() - self.starttime) * 0.8)
			if(timediff != self.countdown):
				if(timediff < 0):
					self.countdown = 0
				self.countdown = timediff
				bytestr += b'\x08\x05' + self.countdown.to_bytes(1, endieness)
				self.filthmap[Filths.Count] = 1

		if(self.filthmap[Filths.P1Y] == 1):
			bytestr += b'\x01' + self.player1.y.to_bytes(4, endieness)
			self.filthmap[Filths.P1Y] = 0
		if(self.filthmap[Filths.P2Y] == 1):
			bytestr += b'\x02' + self.player2.y.to_bytes(4, endieness)
			self.filthmap[Filths.P2Y] = 0
		if(self.filthmap[Filths.P1Score] == 1):
			bytestr += b'\x03' + self.player1.score.to_bytes(4, endieness)
			self.filthmap[Filths.P1Score] = 0
		if(self.filthmap[Filths.P2Score] == 1):
			bytestr += b'\x04' + self.player2.score.to_bytes(4, endieness)
			self.filthmap[Filths.P2Score] = 0
		if(self.filthmap[Filths.Count] == 1):
			bytestr += b'\x08\x05' + self.countdown.to_bytes(1, endieness)
			self.filthmap[Filths.Count] = 0
		try:
			if(self.filthmap[Filths.Ball] == 1):
				bytestr += b'\x05' + self.ball.lasthit.to_bytes(1, endieness, signed=True)\
				+ int(self.ball.x * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.y * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.vx * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.vy * ballprecision).to_bytes(4, endieness, signed=True)
				self.filthmap[Filths.Ball] = 0
		except Exception as e:
			print("error", e)
		if(self.filthmap[Filths.PWin]):
			bytestr += b'\x08\x04' + self.filthmap[Filths.PWin].to_bytes(1, endieness)
			self.filthmap[Filths.PWin] = 0
			if(self.player1.score > self.player2.score):
				self.player1.win_count += 1
				self.player2.loss_count += 1
			else:
				self.player1.loss_count += 1
				self.player2.win_count += 1
			
		return bytestr

	def end_game(self):
		self.ball.x = 0
		self.ball.y = 0
		self.ball.vx = 0
		self.ball.vy = 0
		self.filthmap[Filths.Ball] = 1
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
