#include "pong.hpp"

std::mutex PongGame::mutex;
std::unordered_map<u64, std::unique_ptr<Player> > PongGame::players;

int PongGame::init()
{ // non-zero return value: error
	if(players.size())
		players.clear();
	return 0;
}

PongGame::~PongGame()
{
	printf("PongGame destructed\n");
	MLocker lock(mutex);
	players.clear();
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
	MLocker lock(mutex);
	do
		id = UID(++attempts);
	while(players.find(id) != players.end() && attempts < 16);
	if(attempts >= 16)
		return 0;
	players[id] = std::unique_ptr<Player>(new Player());

	printf("New player with id %lu\nPlayer Count: %lu\n", (u64)id, players.size());

	return id;
}

void PongGame::removePlayer(u64 id)
{
	MLocker lock(mutex);

	printf("Removing player with id %lu\n", (u64)id);

	auto player = players.find(id);
	if(player == players.end())
		return;
	players.erase(id);
}

///////////////////////
// Python interface
///////////////////////

PyObject* PongGame::pyupdate(PyObject* self, PyObject* args)
{
	PongGameObject* const o = (PongGameObject*)self;
	if(!o->game)
	{
		PyErr_SetString(PyExc_RuntimeError, "PongGame not initialized");
		return NULL;
	}
	o->game->update();
	// todo return list of changed values in a tuple or send it directly to all players to avoid python
	Py_RETURN_NONE;
}

PyObject* PongGame::pynewPlayer(PyObject* self, PyObject* args)
{ // create a python player handle that has an id to a player in the game
	// trying desperately to avoid python here by making this handle have a direct route to acting on the game
	// without needing to parse arguments
	PongGameObject* const o = (PongGameObject*)self;
	if(!o->game)
	{
		PyErr_SetString(PyExc_RuntimeError, "PongGame not initialized");
		return NULL;
	}
	u64 id = o->game->newPlayer();
	if(!id)
	{
		PyErr_SetString(PyExc_RuntimeError, "Could not add player");
		return NULL;
	}
	PyObject* player = PyObject_New(PyObject, (PyTypeObject*)PlayerObjectType);
	if(!player)
	{
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for Player");
		o->game->removePlayer(id);
		return NULL;
	}
	// PyObject_Init(player, (PyTypeObject*)PlayerObjectType);
	// set player id directly
	((PlayerObject*)player)->id = id;
	return player;
}

PyObject* PongGame::pynew(PyTypeObject* type, PyObject* args, PyObject* kwds)
{ // allocate PongGameObject
	PongGameObject* self = (PongGameObject*)type->tp_alloc(type, 0);
	if(self != 0)
		self->game = 0;
	return (PyObject*)self;
}

int PongGame::pyinit(PongGame* self, PyObject* args, PyObject* kwds)
{ // allocate and construct PongGame inside PongGameObject
	PongGameObject* const o = (PongGameObject*)self;
	o->game = (PongGame*)PyObject_Malloc(sizeof(PongGame));
	if(!o->game)
	{
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for PongGame");
		return -1;
	}
	new(o->game) PongGame(); // placement new into python allocated memory o->game (basically calling the constructor)
	if(o->game->init())
	{
		PyObject_Free(o->game);
		PyErr_SetString(PyExc_RuntimeError, "Could not initialize PongGame");
		o->game = 0;
		return -1;
	}

	return 0;
}

void PongGame::pydealloc(PongGame* self)
{ // destruct and deallocate PongGame inside PongGameObject
	PongGameObject* const o = (PongGameObject*)self;
	if(o->game)
	{
		o->game->~PongGame(); // call destructor
		PyObject_Free(o->game);
		o->game = 0;
	}
	Py_TYPE(self)->tp_free((PyObject*)self);
}
