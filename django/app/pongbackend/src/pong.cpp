#include "pong.hpp"

#include "player.hpp"
#include "pyWrapper.hpp"
#include "filthmap.hpp"

#define PACKET_MAX_SIZE 256

std::mutex PongGame::mutex;
std::unordered_map<u64, std::unique_ptr<Player> > PongGame::_players;
vec2<i32> PongGame::_ball;
PyObject* PongGame::_pybytes = 0;
Player* PongGame::_player1 = 0;
Player* PongGame::_player2 = 0;
std::thread PongGame::_gameThread;
PyObject* PongGame::pyplayerCount = 0;

int PongGame::init()
{ // non-zero return value: error
	const MLocker lock(mutex);
	if(_players.size())
		_players.clear();
	_pybytes = PyBytes_FromStringAndSize(0, PACKET_MAX_SIZE);
	if(!_pybytes)
		return 1;
	PyVarObject* bytes = (PyVarObject*)_pybytes;
	bytes->ob_size = 0;
	pyplayerCount = PyLong_FromUnsignedLongLong(0);
	return !pyplayerCount;
}

void PongGame::update()
{
	char* const data = (char*)((PyBytesObject*)_pybytes)->ob_sval;
	MLocker lock(PongGame::mutex);
	u64 offset = 0;
	if(_player1 && FilthMap::isFilthy(PLAYER1_Y))
	{
		data[offset++] = PLAYER1_MOVE;
		*(i32*)(data + offset) = _player1->y();
		offset += sizeof(i32);
	}
	if(_player2 && FilthMap::isFilthy(PLAYER2_Y))
	{
		data[offset++] = PLAYER2_MOVE;
		*(i32*)(data + offset) = _player2->y();
		offset += sizeof(i32);
	}
	if(FilthMap::isFilthy(BALL_POS))
	{
		data[offset++] = BALL_HIT;
		*(i32*)(data + offset) = _ball.x;
		offset += sizeof(i32);
		*(i32*)(data + offset) = _ball.y;
		offset += sizeof(i32);
	}
	PyVarObject* const bytes = (PyVarObject*)_pybytes;
	bytes->ob_size = offset;
	FilthMap::cleanFilth();
}

u64 PongGame::newPlayer(Py::PlayerObject& p)
{
	UID id;
	u16 attempts = 0;
	const MLocker lock(mutex);
	do
		id = UID(++attempts);
	while(_players.find(id) != _players.end() && attempts < 16);
	if(attempts >= 16)
		return 0;
	_players[id] = std::unique_ptr<Player>(new Player());

	printf("New player with id %lu\nPlayer Count: %lu\n", (u64)id, _players.size());

	p.pongid = 0;
	if(!_player1)
	{
		p.pongid = 1;
		_player1 = _players[id].get();
	}
	else if(!_player2)
	{
		p.pongid = 2;
		_player2 = _players[id].get();
	}

	pyplayerCount = PyLong_FromUnsignedLongLong(_players.size());

	return id;
}

void PongGame::removePlayer(u64 id)
{
	const MLocker lock(mutex);

	printf("Removing player with id %lu\n", (u64)id);

	auto player = _players.find(id);
	if(player == _players.end())
		return;
	_players.erase(id);

	if(_player1 == player->second.get())
		_player1 = 0;
	else if(_player2 == player->second.get())
		_player2 = 0;

	pyplayerCount = PyLong_FromUnsignedLongLong(_players.size());
}

void PongGame::receive(const char* data, u64 size, u64 playerid)
{
	const MLocker lock(mutex);
	auto pi = _players.find(playerid);
	if(pi == _players.end())
		return;
	Player* player = pi->second.get();
	switch((PongMessage)data[0])
	{
	case PLAYER1_MOVE:
		player->move(*(i32*)(data + 1));
		FilthMap::setFilthy(PLAYER1_Y);
		break;
	case PLAYER2_MOVE:
		player->move(*(i32*)(data + 1));
		FilthMap::setFilthy(PLAYER2_Y);
		break;
	}
}

u64 PongGame::playerCount()
{
	return _players.size();
}

///////////////////////
// Python interface
///////////////////////

PyObject* PongGame::pystartGame(PyObject*, PyObject*)
{
	Py_RETURN_NONE;
}

PyObject* PongGame::pyendGame(PyObject*, PyObject*)
{
	Py_RETURN_NONE;
}

PyObject* PongGame::pyupdate(PyObject*, PyObject*)
{
	PongGame::update();
	// todo return list of changed values in a tuple or send it directly to all players to avoid python
	// PyBytesObject* bytes = (PyBytesObject*)PyBytes_FromStringAndSize("0", 1);
	Py_INCREF(_pybytes);
	return _pybytes;
}

PyObject* PongGame::pynewPlayer(PyObject*, PyObject*)
{ // create a python player handle that has an id to a player in the game
	// trying desperately to avoid python here by making this handle have a direct route to acting on the game
	// without needing to parse arguments
	PyObject* player = PyObject_New(PyObject, (PyTypeObject*)Py::PlayerObject::type);
	if(!player)
	{
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for Player");
		return NULL;
	}
	u64 id = PongGame::newPlayer(*((Py::PlayerObject*)player));
	if(!id)
	{
		PyErr_SetString(PyExc_RuntimeError, "Could not add player");
		Py_DECREF(player);
		return NULL;
	}
	// PyObject_Init(player, (PyTypeObject*)PlayerObjectType);
	// set player id directly
	((Py::PlayerObject*)player)->id = id;
	printf("New player with id %lu\n", id);
	return player;
}

