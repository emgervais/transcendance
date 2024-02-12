#pragma once

#include "pongbackend.hpp"
#include "common.hpp"

class Player
{
public:
	Player();
	~Player();

	void move(i32 y);
	u64 serialize(char* buffer, u64 max);

	i32 y() const { return _y; }

private:
	i32 _y;
};

namespace Py
{
	struct PlayerObject
	{
		PyObject_HEAD
		u64 id;
		u64 pongid;

		static bool registerObject(PyObject* module);

		static PyObject* pyremove(PyObject* self, PyObject* args);
		static PyObject* pyreceive(PyObject* self, PyObject* arg);

		static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
		static int pyinit(PlayerObject* self, PyObject* args, PyObject* kwds);
		static void pydealloc(PlayerObject* self);

		inline static PyTypeObject* type = 0;
	};

	
}

