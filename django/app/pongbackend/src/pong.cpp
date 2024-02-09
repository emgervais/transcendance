#include "pong.hpp"

#include "player.hpp"
#include "pyWrapper.hpp"

std::mutex PongGame::_mutex;
std::unordered_map<u64, std::unique_ptr<Player> > PongGame::_players;
std::thread PongGame::_gameThread;
PyObject* PongGame::pyplayerCount = 0;

int PongGame::init()
{ // non-zero return value: error
	const MLocker lock(_mutex);
	if(_players.size())
		_players.clear();
	pyplayerCount = PyLong_FromUnsignedLongLong(0);
	return 0;
}

void PongGame::update()
{
	// MLocker lock(mutex);
	// PyObject* json;

	// // populate json with game state
	// json = PyDict_New();
	// PyDict_SetItemString(json, "type", PyUnicode_FromString("update"));
	// PyDict_SetItemString(json, "players", PyList_New(0));
	// for(auto& player : players)
	// {
	// 	PyObject* playerjson = PyDict_New();
	// 	PyDict_SetItemString(playerjson, "y", PyLong_FromLong(player.second->y()));
	// 	PyDict_SetItemString(playerjson, "uid", PyLong_FromUnsignedLongLong(player.first));
	// 	PyList_Append(PyDict_GetItemString(json, "players"), playerjson);
	// 	Py_DECREF(playerjson);
	// }
}

u64 PongGame::newPlayer()
{
	UID id;
	u16 attempts = 0;
	const MLocker lock(_mutex);
	do
		id = UID(++attempts);
	while(_players.find(id) != _players.end() && attempts < 16);
	if(attempts >= 16)
		return 0;
	_players[id] = std::unique_ptr<Player>(new Player());

	printf("New player with id %lu\nPlayer Count: %lu\n", (u64)id, _players.size());

	pyplayerCount = PyLong_FromUnsignedLongLong(_players.size());

	return id;
}

void PongGame::removePlayer(u64 id)
{
	const MLocker lock(_mutex);

	printf("Removing player with id %lu\n", (u64)id);

	auto player = _players.find(id);
	if(player == _players.end())
		return;
	_players.erase(id);

	pyplayerCount = PyLong_FromUnsignedLongLong(_players.size());
}

void PongGame::receive(const char* data, u64 size, u64 playerid)
{
	const MLocker lock(_mutex);
	auto pi = _players.find(playerid);
	if(pi == _players.end())
		return;
	Player* player = pi->second.get();
	switch((PongMessage)data[0])
	{
	case PLAYER_MOVE:
		player->move(*(i32*)(data + 1));
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
	PyBytesObject* bytes = (PyBytesObject*)PyBytes_FromStringAndSize("0", 1);
	return (PyObject*)bytes;
}

PyObject* PongGame::pynewPlayer(PyObject*, PyObject*)
{ // create a python player handle that has an id to a player in the game
	// trying desperately to avoid python here by making this handle have a direct route to acting on the game
	// without needing to parse arguments
	u64 id = PongGame::newPlayer();
	if(!id)
	{
		PyErr_SetString(PyExc_RuntimeError, "Could not add player");
		return NULL;
	}
	PyObject* player = PyObject_New(PyObject, (PyTypeObject*)Py::PlayerObject::type);
	if(!player)
	{
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for Player");
		PongGame::removePlayer(id);
		return NULL;
	}
	// PyObject_Init(player, (PyTypeObject*)PlayerObjectType);
	// set player id directly
	((Py::PlayerObject*)player)->id = id;
	printf("New player with id %lu\n", id);
	return player;
}

