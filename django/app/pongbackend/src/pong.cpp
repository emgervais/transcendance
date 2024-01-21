#include "pong.hpp"

int PongGame::init()
{ // non-zero return value: error
	return 0;
}

PongGame::~PongGame()
{
	for(auto& player : players)
		delete player.second;
}

UID PongGame::newPlayer()
{
	UID id;
	u32 attempts = 0;
	MLocker lock(mutex);
	do
	{
		id = UID (++attempts);
	} while(players.find(id) != players.end() && attempts < 16);
	if(attempts >= 16)
		return 0;
	players[id] = new Player();

	return id;
}

void PongGame::removePlayer(UID id)
{
	auto player = players.find(id);
	if(player == players.end())
		return;
	delete players[id];
	players.erase(id);
}

///////////////////////
// Python interface
///////////////////////

struct PongGameObject
{
	PyObject_HEAD
	PongGame* game;
};

PyObject* PongGame::pynewPlayer(PyObject* self, PyObject* args)
{
	PongGameObject* const o = (PongGameObject*)self;
	if(!o->game)
	{
		PyErr_SetString(PyExc_RuntimeError, "PongGame not initialized");
		return NULL;
	}
	UID id = o->game->newPlayer();
	if(!id)
	{
		PyErr_SetString(PyExc_RuntimeError, "Could not add player");
		return NULL;
	}
	return PyLong_FromUnsignedLongLong(id);
}

PyObject* PongGame::pyremovePlayer(PyObject* self, PyObject* args)
{
	PongGameObject* const o = (PongGameObject*)self;
	if(!o->game)
	{
		PyErr_SetString(PyExc_RuntimeError, "PongGame not initialized");
		return NULL;
	}
	u64 id;
	if(!PyArg_ParseTuple(args, "K", &id))
		return NULL;
	o->game->removePlayer(UID::from64(id));
	Py_RETURN_NONE;
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
