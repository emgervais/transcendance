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

def player_count() -> int:
	return len(pbplayers)

def start_game():
	global filthmap
	global pbplayers
	filthmap = [0,0,0,0,0]
	if(len(pbplayers) < 2):
		return

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

class Pong:
	def __init__(self):
		self.filthmap = [0,0,0,0,0]
		self.pbplayers = []
		self.player1 = 0
		self.player2 = 0
		self.ball = Ball()
		self.websockets = []
		self.task = None

	def new_player(self, id, send) -> Player:
		player = Player()
		pbplayers.append(player)
		if(player1 == 0):
			player1 = player
			player.pongid = 1
		elif(player2 == 0):
			player2 = player
			player.pongid = 2
		return player

	def receive(self, bytestr: bytes, player):
		# 1: player movement, 2: player score, 3: ball hit
		# global player1
		# global player2
		if(player.pongid > 2 or player.pongid < 1):
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
					self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness) / ballprecision
					self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness) / ballprecision
					self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness) / ballprecision
					self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness) / ballprecision
					self.filthmap[4] = 1
				offset += 16
			elif(type == 3): # ball hit
				self.ball.lasthit = player.pongid
				self.ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness) / ballprecision
				self.ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness) / ballprecision
				self.ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness) / ballprecision
				self.ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness) / ballprecision
				self.filthmap[4] = 1
			else:
				offset = len(bytestr)

	def update(self) -> bytes:
		if(len(self.pbplayers) < 2):
			return b''
		bytestr = b''
		if(self.filthmap[0] == 1):
			bytestr += b'\x01' + self.player1.y.to_bytes(4, endieness)
			self.filthmap[0] = 0
		if(filthmap[1] == 1):
			bytestr += b'\x02' + player2.y.to_bytes(4, endieness)
			self.filthmap[1] = 0
		if(filthmap[2] == 1):
			bytestr += b'\x04' + player1.score.to_bytes(4, endieness)
			self.filthmap[2] = 0
		if(filthmap[3] == 1):
			bytestr += b'\x03' + player2.score.to_bytes(4, endieness)
			self.filthmap[3] = 0
		if(filthmap[4] == 1):
			bytestr += b'\x05' + self.ball.lasthit.to_bytes(1, endieness) + int(self.ball.x * ballprecision).to_bytes(4, endieness) + int(self.ball.y * ballprecision).to_bytes(4, endieness) + int(self.ball.vx * ballprecision).to_bytes(4, endieness) + int(self.ball.vy * ballprecision).to_bytes(4, endieness)
			self.filthmap[4] = 0
		return bytestr

	def end_game(self):
		self.ball.x = 0
		self.ball.y = 0
		self.ball.vx = 0
		self.ball.vy = 0
		self.filthmap[4] = 1
		return
