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

u64 PongGame::addPlayer()
{
	UID64 id;
	MLocker lock(mutex);
	do
	{
		id = UID64(1);
	} while(players.find(id) != players.end());
	players[id] = new Player();
}

void PongGame::removePlayer(u64 id)
{
	auto player = players.find(id);
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
