#pragma once

#include "pongbackend.hpp"
#include "common.hpp"

class Player
{
public:
	Player();
	~Player();

	void move(i32 y) { _y = y; }

	i32 y() const { return _y; }

private:
	i32 _y;
};

struct PlayerObject
{
	PyObject_HEAD
	u64 id;

	static PyObject* pyremove(PyObject* self, PyObject* args);
	static PyObject* pyreceive(PyObject* self, PyObject* args);

	static PyObject* pynew(PyTypeObject* type, PyObject* args, PyObject* kwds);
	static int pyinit(PlayerObject* self, PyObject* args, PyObject* kwds);
	static void pydealloc(PlayerObject* self);
};

inline PyMethodDef PlayerMethods[] = {
	{"remove", PlayerObject::pyremove, METH_NOARGS, "Remove player"},
	{"receive", PlayerObject::pyreceive, METH_VARARGS, "Receive data"},
	{NULL, NULL, 0, NULL}
};

inline PyMemberDef PlayerMembers[] = {
	{"id", T_ULONGLONG, offsetof(PlayerObject, id), READONLY, "Player id"},
	{NULL}
};

inline PyType_Slot PlayerSlots[] = {
	{Py_tp_new, (void*)PlayerObject::pynew},
	{Py_tp_init, (void*)PlayerObject::pyinit},
	{Py_tp_dealloc, (void*)PlayerObject::pydealloc},
	{Py_tp_methods, PlayerMethods},
	{Py_tp_members, PlayerMembers},
	{0, NULL}
};

inline PyType_Spec PlayerSpec = {
	"pong.Player",
	sizeof(PlayerObject),
	0,
	Py_TPFLAGS_DEFAULT,
	PlayerSlots
};
