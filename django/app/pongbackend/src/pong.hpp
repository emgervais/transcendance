#pragma once

#include <map>
#include <mutex>

#include "pongbackend.hpp"
#include "player.hpp"
#include "uid.hpp"
#include "common.hpp"

struct MLocker
{
	std::mutex& mutex;
	MLocker(std::mutex& mutex) : mutex(mutex) { mutex.lock(); }
	~MLocker() { mutex.unlock(); }
};

class PongGame
{
public:
	~PongGame();

	int init();

	UID newPlayer();
	void removePlayer(UID id);

	static PyObject* pynewPlayer(PyObject* self, PyObject* args);
	static PyObject* pyremovePlayer(PyObject* self, PyObject* args);

	static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
	static int pyinit(PongGame* self, PyObject* args, PyObject* kwds);
	static void pydealloc(PongGame* self);

private:
	std::mutex mutex;
	std::map<UID, Player*> players;
};

#ifdef PYSPECS

static PyMethodDef PongGameMethods[] = {
	{"new_player", PongGame::pynewPlayer, METH_NOARGS, "Create new player and return uid"},
	{"remove_player", PongGame::pyremovePlayer, METH_VARARGS, "Remove a player with uid"},
	{NULL, NULL, 0, NULL}
};

static PyType_Slot PongGameSlots[] = {
	{Py_tp_new, (void*)PongGame::pynew},
	{Py_tp_init, (void*)PongGame::pyinit},
	{Py_tp_dealloc, (void*)PongGame::pydealloc},
	{Py_tp_methods, (void*)PongGameMethods},
	{0, NULL}
};

static PyType_Spec PongGameSpec = {
	"pong.PongGame",
	sizeof(PongGame),
	0,
	Py_TPFLAGS_DEFAULT,
	PongGameSlots
};

#endif
