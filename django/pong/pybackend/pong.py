endieness = 'little'

ballprecision = 1000.0

class Ball:
	def __init__(self):
		self.x = 0.0
		self.y = 0.0
		self.vx = 0.0
		self.vy = 0.0
		self.lasthit = 0

class Player:
	def __init__(self):
		self.score = 0
		self.y = 0
		self.pongid = 0

class Pong:
	def __init__(self):
		self.filthmap = [0,0,0,0,0]
		self.pbplayers = []
		self.player1 = 0
		self.player2 = 0
		self.ball = Ball()
		self.websockets = []
		self.task = None

	def player_count(self) -> int:
		return len(self.pbplayers)
	
	def start_game(self):
		self.filthmap = [0,0,0,0,0]
		self.ball.x = 39
		self.ball.y = 26.5
		self.ball.vx = -0.03

		self.ball.vy = 0
		self.filthmap[4] = 1
		self.player1.score = 0
		self.player2.score = 0
		self.lasthit = 1

	def new_player(self, send) -> Player:
		player = Player()
		self.pbplayers.append(player)
		self.websockets.append(send)
		if(self.player1 == 0):
			self.player1 = player
			player.pongid = 1
		elif(self.player2 == 0):
			self.player2 = player
			player.pongid = 2
		return player

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
			if(type == 1): # player movement
				if(player != 0):
					player.y = int.from_bytes(bytestr[offset:(offset + 4)], endieness)
					self.filthmap[player.pongid - 1] = 1
				offset += 4
			elif(type == 2): # player score
				print("player score: " + str(player.pongid))
				if(player != 0):
					player.score += 1
					self.filthmap[player.pongid + 1] = 1
					self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness, signed=True) / ballprecision
					self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness, signed=True) / ballprecision
					self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness, signed=True) / ballprecision
					self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness, signed=True) / ballprecision
					self.filthmap[4] = 1
				offset += 16
			elif(type == 3): # ball hit
				self.ball.lasthit = player.pongid
				self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness, signed=True) / ballprecision
				self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness, signed=True) / ballprecision
				self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness, signed=True) / ballprecision
				self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness, signed=True) / ballprecision
				self.filthmap[4] = 1
				offset += 16
			else:
				offset = len(bytestr)

	def update(self) -> bytes:
		global endieness
		global ballprecision
		if(len(self.pbplayers) < 2):
			return b''
		bytestr = b''
		if(self.filthmap[0] == 1):
			bytestr += b'\x01' + self.player1.y.to_bytes(4, endieness)
			self.filthmap[0] = 0
		if(self.filthmap[1] == 1):
			bytestr += b'\x02' + self.player2.y.to_bytes(4, endieness)
			self.filthmap[1] = 0
		if(self.filthmap[2] == 1):
			bytestr += b'\x04' + self.player1.score.to_bytes(4, endieness)
			self.filthmap[2] = 0
		if(self.filthmap[3] == 1):
			bytestr += b'\x03' + self.player2.score.to_bytes(4, endieness)
			self.filthmap[3] = 0
		try:
			if(self.filthmap[4] == 1):
				bytestr += b'\x05' + self.ball.lasthit.to_bytes(1, endieness, signed=True)\
				+ int(self.ball.x * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.y * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.vx * ballprecision).to_bytes(4, endieness, signed=True)\
				+ int(self.ball.vy * ballprecision).to_bytes(4, endieness, signed=True)
				self.filthmap[4] = 0
		except Exception as e:
			print("error", e)
		return bytestr

	def end_game(self):
		self.ball.x = 0
		self.ball.y = 0
		self.ball.vx = 0
		self.ball.vy = 0
		self.filthmap[4] = 1
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
