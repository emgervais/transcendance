#include "pyWrapper.hpp"

#include "common.hpp"

static PyCFunction getmethod(PyTypeObject* to, const char*&& name)
{
	u64 i = 0;
	while(to->tp_methods[i].ml_name)
	{
		if(strcmp(to->tp_methods[i].ml_name, name) == 0 && !(to->tp_methods[i].ml_flags & METH_KEYWORDS))
			return to->tp_methods[i].ml_meth;
		++i;
	}
	return NULL;
}

static PyMemberDef* getmember(PyTypeObject* to, const char*&& name)
{
	u64 i = 0;
	while(to->tp_members[i].name)
	{
		if(strcmp(to->tp_members[i].name, name) == 0)
			return &to->tp_members[i];
		++i;
	}
	return NULL;
}

// static PyCFunctionWithKeywords getmethodkw(PyTypeObject* to, const char*&& name)
// {
// 	u64 i = 0;
// 	while(to->tp_methods[i].ml_name)
// 	{
// 		if(strcmp(to->tp_methods[i].ml_name, name) == 0 && (to->tp_methods[i].ml_flags & METH_KEYWORDS))
// 			return (PyCFunctionWithKeywords)to->tp_methods[i].ml_meth;
// 		++i;
// 	}
// 	return NULL;
// }

// static void listmethods(PyTypeObject* to)
// {
// 	u64 i = 0;
// 	while(to->tp_methods[i].ml_name)
// 	{
// 		printf("Method: %s\n", to->tp_methods[i].ml_name);
// 		printf("\tFlags: ");
// 		if(to->tp_methods[i].ml_flags & METH_VARARGS)
// 			printf("METH_VARARGS ");
// 		if(to->tp_methods[i].ml_flags & METH_KEYWORDS)
// 			printf("METH_KEYWORDS ");
// 		if(to->tp_methods[i].ml_flags & METH_NOARGS)
// 			printf("METH_NOARGS ");
// 		if(to->tp_methods[i].ml_flags & METH_O)
// 			printf("METH_O ");
// 		if(to->tp_methods[i].ml_flags & METH_CLASS)
// 			printf("METH_CLASS ");
// 		if(to->tp_methods[i].ml_flags & METH_STATIC)
// 			printf("METH_STATIC ");
// 		if(to->tp_methods[i].ml_flags & METH_COEXIST)
// 			printf("METH_COEXIST ");
// 		printf("\n");
// 		++i;
// 	}
// }

namespace Py
{
	bool init()
	{
		printf("Initializing pong backend\n");
		srand(time(0) * 7348194244561);
		// fetch the get_asgi_application function from django.core.asgi and call it to cache the asgi application
		PyObject* djasgi = PyImport_ImportModule("django.core.asgi");
		PyObject* get_asgi_application = PyObject_GetAttrString(djasgi, "get_asgi_application");
		Py_DECREF(djasgi);
		djasgiApp = PyObject_CallFunctionObjArgs(get_asgi_application, NULL);
		Py_DECREF(get_asgi_application);
		if(!djasgiApp)
		{
			PyErr_SetString(PyExc_RuntimeError, "Failed to initialize django.asgi application");
			return 0;
		}

		PyObject* asyncio = PyImport_ImportModule("asyncio");
		Future::type = (PyTypeObject*)PyObject_GetAttrString(asyncio, "Future");
		Future::result = getmethod(Future::type, "result");
		Py_DECREF(asyncio);
		if(!Future::type || !Future::result)
		{
			PyErr_SetString(PyExc_RuntimeError, "Failed to initialize asyncio.Future");
			Py_DECREF(djasgiApp);
			return 0;
		}

		Coro::cr_running = getmember(&PyCoro_Type, "cr_running");

		Py_RETURN_NONE;
	}
}
