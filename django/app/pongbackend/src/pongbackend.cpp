#include "pongbackend.hpp"

#include "pong.hpp"
#include "player.hpp"

#include <stdlib.h>
#include <time.h>

static PyObject* Pong_init(PyObject* self, PyObject* args) {
	srand(time(0));
	return PyLong_FromLong(0);
}

static PyMethodDef PongBackendMethods[] = {
	{"init", Pong_init, METH_VARARGS, "Initialize the pong backend"},
	{"new_player", PongGame::pynewPlayer, METH_NOARGS, "Create a new player"},
	{NULL, NULL, 0, NULL}
};

static PyModuleDef PongBackendModule = {
	PyModuleDef_HEAD_INIT,
	"pong",
	"Pong Module",
	-1,
	PongBackendMethods
};

PyMODINIT_FUNC PyInit_pong(void) {
	PyObject* module =  PyModule_Create(&PongBackendModule);
	PongObjectType = PyType_FromSpec(&PongGameSpec);
	PlayerObjectType = PyType_FromSpec(&PlayerSpec);
	if(!module || !PongObjectType || !PlayerObjectType
		|| PyModule_AddObject(module, "PongGame", PongObjectType)
		|| PyModule_AddObject(module, "Player", PlayerObjectType))
	{
		Py_XDECREF(module);
		Py_XDECREF(PongObjectType);
		Py_XDECREF(PlayerObjectType);
		return NULL;
	}

	return module;
}
