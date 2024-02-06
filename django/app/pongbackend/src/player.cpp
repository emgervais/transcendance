#include "player.hpp"

#include "pong.hpp"
#include "uid.hpp"

Player::Player()
{
	printf("Player constructor\n");
	_y = 0;
}
Player::~Player()
{
	printf("Player destructor\n");
}

///////////////////////
// Python interface
///////////////////////

namespace Py
{
	static PyMethodDef _methods[] = {
		{"remove", PlayerObject::pyremove, METH_NOARGS, "Remove player"},
		{"receive", PlayerObject::pyreceive, METH_O, "Receive data"},
		{NULL, NULL, 0, NULL}
	};
	static PyMemberDef _members[] = {
		{"id", T_ULONGLONG, offsetof(PlayerObject, id), READONLY, "Player id"},
		{NULL}
	};
	static PyType_Slot _slots[] = {
		{Py_tp_new, (void*)PlayerObject::pynew},
		{Py_tp_init, (void*)PlayerObject::pyinit},
		{Py_tp_dealloc, (void*)PlayerObject::pydealloc},
		{Py_tp_methods, _methods},
		{Py_tp_members, _members},
		{0, NULL}
	};
	static PyType_Spec _spec = {
		"pong.Player",
		sizeof(PlayerObject),
		0,
		Py_TPFLAGS_DEFAULT,
		_slots
	};

	bool PlayerObject::registerObject(PyObject* module)
	{
		type = (PyTypeObject*)PyType_FromSpec(&_spec);
		if(!type)
			return false;
		if(PyModule_AddObject(module, "Player", (PyObject*)type))
		{
			Py_DECREF(type);
			return false;
		}
		return true;
	}

	PyObject* PlayerObject::pyremove(PyObject* self, PyObject* args) {
		PlayerObject* const o = (PlayerObject*)self;
		PongGame::removePlayer(o->id);
		Py_RETURN_NONE;
	}

	PyObject* PlayerObject::pyreceive(PyObject* self, PyObject* arg) {
		PlayerObject* const o = (PlayerObject*)self;
		if(PyBytes_CheckExact(arg))
		{
			PyErr_SetString(PyExc_TypeError, "Expected bytes");
			return NULL;
		}
		PongGame::receive(PyBytes_AS_STRING(arg), PyBytes_GET_SIZE(arg), o->id);
		Py_RETURN_NONE;
	}

	PyObject* PlayerObject::pynew(PyTypeObject* type, PyObject* args, PyObject* kwds) {
		PlayerObject* self = (PlayerObject*)type->tp_alloc(type, 0);
		if(self != 0)
			self->id = 0;
		return (PyObject*)self;
	}

	int PlayerObject::pyinit(PlayerObject* self, PyObject* args, PyObject* kwds) {
		return 0;
	}

	void PlayerObject::pydealloc(PlayerObject* self) {
		Py_TYPE(self)->tp_free((PyObject*)self);
	}
}
