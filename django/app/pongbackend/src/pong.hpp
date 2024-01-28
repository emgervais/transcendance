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

	u64 addPlayer();
	void removePlayer(u64 id);

	static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
	static int pyinit(PongGame* self, PyObject* args, PyObject* kwds);
	static void pydealloc(PongGame* self);

private:
	std::mutex mutex;
	std::map<UID64, Player*> players;
};

inline static PyType_Slot PongGameSlots[] = {
	{Py_tp_new, (void*)PongGame::pynew},
	{Py_tp_init, (void*)PongGame::pyinit},
	{Py_tp_dealloc, (void*)PongGame::pydealloc},
	{0, NULL}
};

inline static PyType_Spec PongGameSpec = {
	"pong.PongGame",
	sizeof(PongGame),
	0,
	Py_TPFLAGS_DEFAULT,
	PongGameSlots
};
