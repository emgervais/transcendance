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

	static u64 playerCount();

	// static PyObject* pystartGame(PyObject* self, PyObject* args);
	// static PyObject* pyendGame(PyObject* self, PyObject* args);
	// static PyObject* pynewPlayer(PyObject* self, PyObject* args);
	// static PyObject* pyupdate(PyObject* self, PyObject* args);

private:
	static std::mutex _mutex;
	static std::unordered_map<u64, std::unique_ptr<Player> > _players;

	static std::thread _gameThread;
};
