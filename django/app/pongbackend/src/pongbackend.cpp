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

static PyObject* getevent(PyObject* self, PyObject* const * args, Py_ssize_t nargs)
{
	PyObject* const event = args[0];
	const u8* const type = PyUnicode_1BYTE_DATA(PyDict_GetItemString(event, "type"));
	if(type[0] == 'w')
	{
		if(type[10] == 'r') // receive
		{
			u64 playerid = ((Py::PlayerObject*)args[1])->id;
			Py_ssize_t size;
			char* data;
			PyBytes_AsStringAndSize(PyDict_GetItemString(event, "bytes"), &data, &size);
			PongGame::receive(data, size, playerid);
			return PyLong_FromLong(0);
		}
		else if(type[10] == 'c') // connect
			return PyLong_FromLong(1);
		else if(type[10] == 'd') // disconnect
			return PyLong_FromLong(2);
	}

	return PyLong_FromLong(0);
}

static PyObject* getplayercount(PyObject*, PyObject*)
{
	return PongGame::pyplayerCount;
}

static PyMethodDef PongBackendMethods[] = {
	{"get_event", (PyCFunction)getevent, METH_FASTCALL, "recv ws event"},
	{"new_player", PongGame::pynewPlayer, METH_NOARGS, "Create a new player"},
	{"start_game", PongGame::pystartGame, METH_NOARGS, "Start the game"},
	{"end_game", PongGame::pyendGame, METH_NOARGS, "End the game"},
	{"update", PongGame::pyupdate, METH_NOARGS, "Update the game and get data to broadcast"},
	{"player_count", getplayercount, METH_NOARGS, "Get the number of players"},
	{NULL, NULL, 0, NULL}
};

static PyModuleDef PongBackendModule = {
	PyModuleDef_HEAD_INIT,
	"pong",
	"Pong Module",
	-1,
	PongBackendMethods,

};

PyMODINIT_FUNC PyInit_pong(void)
{
	PyObject* module =  PyModule_Create(&PongBackendModule);
	PongGame::init();
	if(!module || !Py::PlayerObject::registerObject(module) || !Py::init())
	{
		Py_XDECREF(module);
		return NULL;
	}

	return module;
}
