#include "pongbackend.hpp"

#define PYSPECS
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
	PyObject* pongclass = PyType_FromSpec(&PongGameSpec);
	PyObject* playerclass = PyType_FromSpec(&PlayerSpec);
	if(!module || !pongclass || !playerclass
		|| PyModule_AddObject(module, "PongGame", pongclass)
		|| PyModule_AddObject(module, "Player", playerclass))
	{
		Py_XDECREF(playerclass);
		Py_XDECREF(pongclass);
		Py_XDECREF(module);
		return NULL;
	}

	return module;
}
