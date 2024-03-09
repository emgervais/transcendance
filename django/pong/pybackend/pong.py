filthmap = [0,0,0,0,0]

pbplayers = []

player1 = 0
player2 = 0

endieness = 'little'

ballprecision = 1000.0

class Ball:
	def __init__(self):
		self.x = 0.0
		self.y = 0.0
		self.vx = 0.0
		self.vy = 0.0
		self.lasthit = 0

ball = Ball()

class Player:
	def __init__(self):
		self.score = 0
		self.y = 0
		self.pongid = 0

	def remove(self):
		global pbplayers
		global player1
		global player2
		if(self == player1):
			player1 = 0
		elif(self == player2):
			player2 = 0
		pbplayers.remove(self)

def receive(bytestr: bytes, player):
	# 1: player movement, 2: player score, 3: ball hit
	global filthmap
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
				filthmap[player.pongid - 1] = 1
			offset += 4
		elif(type == 2): # player score
			print("player score: " + str(player.pongid))
			if(player != 0):
				player.score += 1
				filthmap[player.pongid + 1] = 1
				ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness) / ballprecision
				ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness) / ballprecision
				ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness) / ballprecision
				ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness) / ballprecision
				filthmap[4] = 1
			offset += 16
		elif(type == 3): # ball hit
			ball.lasthit = player.pongid
			ball.x = int.from_bytes(bytestr[offset:(offset + 4)], endieness) / ballprecision
			ball.y = int.from_bytes(bytestr[(offset + 4):(offset + 8)], endieness) / ballprecision
			ball.vx = int.from_bytes(bytestr[(offset + 8):(offset + 12)], endieness) / ballprecision
			ball.vy = int.from_bytes(bytestr[(offset + 12):(offset + 16)], endieness) / ballprecision
			filthmap[4] = 1
		else:
			offset = len(bytestr)

def new_player() -> Player:
	global pbplayers
	global player1
	global player2
	player = Player()
	pbplayers.append(player)
	if(player1 == 0):
		player1 = player
		player.pongid = 1
	elif(player2 == 0):
		player2 = player
		player.pongid = 2
	return player

def player_count() -> int:
	return len(pbplayers)

def start_game():
	global filthmap
	global pbplayers
	filthmap = [0,0,0,0,0]
	if(len(pbplayers) < 2):
		return

def get_event(event, player):
	type = event['type']
	if(type[0] == 'w'):
		if(type[10] == 'r'):
			receive(event['bytes'], player)
		elif(type[10] == 'c'):
			return 1
		elif(type[10] == 'd'):
			return 2
	return 0

def end_game():
	global filthmap
	global pbplayers
	global player1
	global player2
	global ball
	ball.x = 0
	ball.y = 0
	ball.vx = 0
	ball.vy = 0
	filthmap[4] = 1
	return

def update() -> bytes:
	global filthmap
	global pbplayers
	global player1
	global player2
	global ball
	if(len(pbplayers) < 2):
		return b''
	bytestr = b''
	if(filthmap[0] == 1):
		bytestr += b'\x01' + player1.y.to_bytes(4, endieness)
		filthmap[0] = 0
	if(filthmap[1] == 1):
		bytestr += b'\x02' + player2.y.to_bytes(4, endieness)
		filthmap[1] = 0
	if(filthmap[2] == 1):
		bytestr += b'\x04' + player1.score.to_bytes(4, endieness)
		filthmap[2] = 0
	if(filthmap[3] == 1):
		bytestr += b'\x03' + player2.score.to_bytes(4, endieness)
		filthmap[3] = 0
	if(filthmap[4] == 1):
		bytestr += b'\x05' + ball.lasthit.to_bytes(1, endieness) + int(ball.x * ballprecision).to_bytes(4, endieness) + int(ball.y * ballprecision).to_bytes(4, endieness) + int(ball.vx * ballprecision).to_bytes(4, endieness) + int(ball.vy * ballprecision).to_bytes(4, endieness)
		filthmap[4] = 0
	return bytestr