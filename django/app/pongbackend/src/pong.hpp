#pragma once

#include <unordered_map>
#include <mutex>
#include <memory>
#include <thread>

#include "pongbackend.hpp"
#include "player.hpp"
#include "uid.hpp"
#include "common.hpp"

enum PongMessage : u8
{
	PLAYER_MOVE = 1
};

struct MLocker
{ // simple wrapper for locking a mutex and unlocking it when the object goes out of scope
	std::mutex& mutex;
	MLocker(std::mutex& mutex) : mutex(mutex) { mutex.lock(); }
	~MLocker() { mutex.unlock(); }
};

class PongGame
{
public:
	static int init();
	static void update();

	static u64 newPlayer();
	static void removePlayer(u64 id);
	static void receive(const char* data, u64 size, u64 playerid);

	static PyObject* pystartGame(PyObject* self, PyObject* args);
	static PyObject* pyendGame(PyObject* self, PyObject* args);
	static PyObject* pynewPlayer(PyObject* self, PyObject* args);
	static PyObject* pyupdate(PyObject* self, PyObject* args);

	static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
	static int pyinit(PongGame* self, PyObject* args, PyObject* kwds);
	static void pydealloc(PongGame* self);

private:
	static u64 playerCount;

	static std::mutex mutex;
	static std::unordered_map<u64, std::unique_ptr<Player> > players;

	static std::thread gameThread;
};

struct PongGameObject
{
	PyObject_HEAD
};

inline PyType_Slot PongGameSlots[] = {
	{Py_tp_new, (void*)PongGame::pynew},
	{Py_tp_init, (void*)PongGame::pyinit},
	{Py_tp_dealloc, (void*)PongGame::pydealloc},
	{0, NULL}
};

inline PyType_Spec PongGameSpec = {
	"pong.PongGame",
	sizeof(PongGameObject),
	0,
	Py_TPFLAGS_DEFAULT,
	PongGameSlots
};
