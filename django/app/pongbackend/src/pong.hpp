#pragma once

#include <unordered_map>
#include <mutex>
#include <memory>
#include <thread>

#include "pongbackend.hpp"
#include "player.hpp"
#include "uid.hpp"
#include "vec2.hpp"
#include "common.hpp"

enum PongMessage : u8
{
	PLAYER1_MOVE = 1,
	PLAYER2_MOVE,
	BALL_HIT
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

	static u64 newPlayer(Py::PlayerObject& p);
	static void removePlayer(u64 id);
	static void receive(const char* data, u64 size, u64 playerid);

	static u64 playerCount();

	static PyObject* pystartGame(PyObject*, PyObject*);
	static PyObject* pyendGame(PyObject*, PyObject*);
	static PyObject* pynewPlayer(PyObject*, PyObject*);
	static PyObject* pyupdate(PyObject*, PyObject*);

	static PyObject* pyplayerCount;

	static std::mutex mutex;

private:
	static std::unordered_map<u64, std::unique_ptr<Player> > _players;

	static vec2<i32> _ball;

	static Player* _player1;
	static Player* _player2;

	static PyObject* _pybytes;

	static std::thread _gameThread;
};
