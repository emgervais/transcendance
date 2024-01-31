#include "pong.hpp"

u64 PongGame::playerCount = 0;
std::mutex PongGame::mutex;
std::unordered_map<u64, std::unique_ptr<Player> > PongGame::players;
std::thread PongGame::gameThread;

int PongGame::init()
{ // non-zero return value: error
	const MLocker lock(mutex);
	if(players.size())
		players.clear();
	playerCount = 0;
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
	const MLocker lock(mutex);
	do
		id = UID(++attempts);
	while(players.find(id) != players.end() && attempts < 16);
	if(attempts >= 16)
		return 0;
	players[id] = std::unique_ptr<Player>(new Player());

	printf("New player with id %lu\nPlayer Count: %lu\n", (u64)id, players.size());
	++playerCount;

	return id;
}

void PongGame::removePlayer(u64 id)
{
	const MLocker lock(mutex);

	printf("Removing player with id %lu\n", (u64)id);

	auto player = players.find(id);
	if(player == players.end())
		return;
	players.erase(id);
	--playerCount;
}

void PongGame::receive(const char* data, u64 size, u64 playerid)
{
	const MLocker lock(mutex);
	auto pi = players.find(playerid);
	if(pi == players.end())
		return;
	Player* player = pi->second.get();
	switch((PongMessage)data[0])
	{
	case PLAYER_MOVE:
		player->move(*(i32*)(data + 1));
		break;
	}
}

///////////////////////
// Python interface
///////////////////////

PyObject* PongGame::pystartGame(PyObject* self, PyObject* args)
{
	Py_RETURN_NONE;
}

PyObject* PongGame::pyupdate(PyObject* self, PyObject* args)
{
	PongGame::update();
	// todo return list of changed values in a tuple or send it directly to all players to avoid python
	Py_RETURN_NONE;
}

PyObject* PongGame::pynewPlayer(PyObject* self, PyObject* args)
{ // create a python player handle that has an id to a player in the game
	// trying desperately to avoid python here by making this handle have a direct route to acting on the game
	// without needing to parse arguments
	u64 id = PongGame::newPlayer();
	if(!id)
	{
		PyErr_SetString(PyExc_RuntimeError, "Could not add player");
		return NULL;
	}
	PyObject* player = PyObject_New(PyObject, (PyTypeObject*)PlayerObjectType);
	if(!player)
	{
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for Player");
		PongGame::removePlayer(id);
		return NULL;
	}
	// PyObject_Init(player, (PyTypeObject*)PlayerObjectType);
	// set player id directly
	((PlayerObject*)player)->id = id;
	return player;
}

PyObject* PongGame::pynew(PyTypeObject* type, PyObject* args, PyObject* kwds)
{
	return type->tp_alloc(type, 0);
}

int PongGame::pyinit(PongGame* self, PyObject* args, PyObject* kwds)
{
	if(!self || PongGame::init())
		return -1;
	return 0;
}

void PongGame::pydealloc(PongGame* self)
{
	printf("PongGame destructed\n");
	const MLocker lock(mutex);
	players.clear();
	Py_TYPE(self)->tp_free((PyObject*)self);
}
