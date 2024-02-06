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

static void coroWait(PyObject* coro)
{ // wait for a coroutine to finish, there's definitely a better way to do this
	while(*(((u8*)coro) + Py::Coro::cr_running->offset)); // fetch the value of cr_running by doing occult magic
	std::this_thread::yield(); // yield to other threads to avoid checking multiple times without letting other threads run
}

static PyObject* asgiThread(PyObject* self, PyObject* const * args, Py_ssize_t nargs)
{
	PyObject* scope = args[0];
	PyObject* receive = args[1];
	PyObject* send = args[2];
	printf("Started pong websocket thread\n");

	if(!PyCallable_Check(receive) || !PyCallable_Check(send))
	{
		PyErr_SetString(PyExc_TypeError, "receive and send must be callable");
		return NULL;
	}
	while(true)
	{
		PyObject* eventfuture = PyObject_CallNoArgs(receive);
		if(!eventfuture)
		{
			printf("No future\n");
			PyErr_Print();
			break;
		}
		listmethods((PyTypeObject*)Py_TYPE(eventfuture));
		listmembers((PyTypeObject*)Py_TYPE(eventfuture));
		PyObject* frame = (PyObject*)eventfuture + 2;
		listmethods((PyTypeObject*)Py_TYPE(frame));
		listmembers((PyTypeObject*)Py_TYPE(frame));
		PyObject* event = PyObject_CallMethod(eventfuture, "result", NULL);
		if(!event)
		{
			printf("No event\n");
			PyErr_Print();
			break;
		}
		listmethods((PyTypeObject*)Py_TYPE(event));
		listmembers((PyTypeObject*)Py_TYPE(event));
		PyObject* type = PyDict_GetItemString(event, "type");
		if(!type)
		{
			printf("No type\n");
			PyErr_SetString(PyExc_KeyError, "event has no type");
			break;
		}


		Py_DECREF(type);
		Py_DECREF(event);
		Py_DECREF(eventfuture);
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
		return PyLong_FromLong(1);
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
