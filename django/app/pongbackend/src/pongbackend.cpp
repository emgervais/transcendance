#include "pongbackend.hpp"

#include "pong.hpp"
#include "player.hpp"
#include "pyWrapper.hpp"

#include <stdlib.h>
#include <stdio.h>
#include <time.h>
#include <thread>

static void listmethods(PyTypeObject* to)
{
	u64 i = 0;
	while(to->tp_methods[i].ml_name)
	{
		printf("Method: %s\n", to->tp_methods[i].ml_name);
		printf("\tFlags: ");
		if(to->tp_methods[i].ml_flags & METH_VARARGS)
			printf("METH_VARARGS ");
		if(to->tp_methods[i].ml_flags & METH_KEYWORDS)
			printf("METH_KEYWORDS ");
		if(to->tp_methods[i].ml_flags & METH_NOARGS)
			printf("METH_NOARGS ");
		if(to->tp_methods[i].ml_flags & METH_O)
			printf("METH_O ");
		if(to->tp_methods[i].ml_flags & METH_CLASS)
			printf("METH_CLASS ");
		if(to->tp_methods[i].ml_flags & METH_STATIC)
			printf("METH_STATIC ");
		if(to->tp_methods[i].ml_flags & METH_COEXIST)
			printf("METH_COEXIST ");
		printf("\n");
		++i;
	}
}

static void listmembers(PyTypeObject* to)
{
	u64 i = 0;
	while(to->tp_members[i].name)
	{
		printf("Member: %s\n", to->tp_members[i].name);
		printf("\tType: ");
		if(to->tp_members[i].type == T_OBJECT)
			printf("T_OBJECT ");
		else if(to->tp_members[i].type == T_OBJECT_EX)
			printf("T_OBJECT_EX ");
		else if(to->tp_members[i].type == T_DOUBLE)
			printf("T_DOUBLE ");
		else if(to->tp_members[i].type == T_STRING)
			printf("T_STRING ");
		else if(to->tp_members[i].type == T_CHAR)
			printf("T_CHAR ");
		else if(to->tp_members[i].type == T_BYTE)
			printf("T_BYTE ");
		else if(to->tp_members[i].type == T_UBYTE)
			printf("T_UBYTE ");
		else if(to->tp_members[i].type == T_USHORT)
			printf("T_USHORT ");
		else if(to->tp_members[i].type == T_UINT)
			printf("T_UINT ");
		else if(to->tp_members[i].type == T_ULONG)
			printf("T_ULONG ");
		else if(to->tp_members[i].type == T_LONGLONG)
			printf("T_LONGLONG ");
		else if(to->tp_members[i].type == T_ULONGLONG)
			printf("T_ULONGLONG ");
		else if(to->tp_members[i].type == T_PYSSIZET)
			printf("T_PYSSIZET ");
		else if(to->tp_members[i].type == T_BOOL)
			printf("T_BOOL ");
		else if(to->tp_members[i].type == T_NONE)
			printf("T_NONE ");
		printf("%d\n", to->tp_members[i].type);
		printf("\tOffset: %li\n", to->tp_members[i].offset);
		++i;
	}
}

static PyObject* asgiThread(PyObject* self, PyObject* const * args, Py_ssize_t nargs)
{
	PyObject* scope = args[0];
	PyObject* receive = PyObject_CallFunctionObjArgs(Py::asyncToSync, args[1], NULL);
	PyObject* send = PyObject_CallFunctionObjArgs(Py::asyncToSync, args[2], NULL);
	printf("Started pong websocket thread\n");

	if(!receive || !send || !PyCallable_Check(receive) || !PyCallable_Check(send))
	{
		PyErr_SetString(PyExc_TypeError, "receive and send must be callable");
		return NULL;
	}
	// confirm we connected by sending accept event
	PyObject* dict = PyDict_New();
	PyDict_SetItemString(dict, "type", PyUnicode_FromString("websocket.accept"));
	PyObject* result = PyObject_CallFunctionObjArgs(send, dict, NULL);
	// print type name of result to check
	printf("Result type: %s\n", result->ob_type->tp_name);
	while(true)
	{
		PyObject* event = PyObject_CallFunctionObjArgs(receive, NULL);
		if(!event)
		{
			PyErr_SetString(PyExc_RuntimeError, "Failed to receive event");
			break;
		}

		listmethods((PyTypeObject*)event->ob_type);
		listmembers((PyTypeObject*)event->ob_type);

		Py_DECREF(event);
		break;
		// break if type is close
	}
	// just send a websocket.close event for now
	// PyObject* dict = PyDict_New();
	// PyDict_SetItemString(dict, "type", PyUnicode_FromString("websocket.accept"));
	// PyObject* future = PyObject_CallFunctionObjArgs(send, dict, NULL);
	// coroWait(future);
	// Py_DECREF(future);
	// PyDict_SetItemString(dict, "type", PyUnicode_FromString("websocket.close"));
	// future = PyObject_CallFunctionObjArgs(send, dict, NULL);
	// coroWait(future);
	// Py_DECREF(future);
	// Py_DECREF(dict);
	printf("Ended pong websocket thread\n");
	Py_RETURN_NONE;
}

static PyObject* checktype(PyObject* self, PyObject* const * args, Py_ssize_t nargs)
{
	PyObject* scope = args[0];
	PyObject* scopetype = PyDict_GetItemString(scope, "type");
	const char* sp = PyUnicode_AS_DATA(scopetype);
	printf("Type: %4.4s\n", sp);
	if(sp[0] == 'h')
	{
		Py_DECREF(scopetype);
		return PyLong_FromLong(1);
	}
	Py_DECREF(scopetype);
	return PyLong_FromLong(0);
}

static PyMethodDef PongBackendMethods[] = {
	{"checktype", (PyCFunction)checktype, METH_FASTCALL, "check if http or websocket"}, // needs kwargs
	{"wsapp", (PyCFunction)asgiThread, METH_FASTCALL, "start pong websocket app"},
	// {"new_player", PongGame::pynewPlayer, METH_NOARGS | METH_STATIC, "Create a new player"},
	{NULL, NULL, 0, NULL}
};

static PyModuleDef PongBackendModule = {
	PyModuleDef_HEAD_INIT,
	"pong",
	"Pong Module",
	-1,
	PongBackendMethods
};

PyMODINIT_FUNC PyInit_pong(void)
{
	PyObject* module =  PyModule_Create(&PongBackendModule);
	if(!module || !Py::init())
	{
		Py_XDECREF(module);
		return NULL;
	}

	return module;
}
