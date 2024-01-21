#pragma once

#include "pongbackend.hpp"
#include "common.hpp"

class Player
{
public:
	Player() noexcept;
	~Player();

	static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
	static int pyinit(Player* self, PyObject* args, PyObject* kwds);
	static void pydealloc(Player* self);

private:
	i32 _y;
};

#ifdef PYSPECS

static PyType_Slot PlayerSlots[] = {
	{Py_tp_new, (void*)Player::pynew},
	{Py_tp_init, (void*)Player::pyinit},
	{Py_tp_dealloc, (void*)Player::pydealloc},
	{0, NULL}
};

static PyType_Spec PlayerSpec = {
	"pong.Player",
	sizeof(Player),
	0,
	Py_TPFLAGS_DEFAULT,
	PlayerSlots
};

#endif
