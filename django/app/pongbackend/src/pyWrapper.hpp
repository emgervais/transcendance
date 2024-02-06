#include "pongbackend.hpp"

namespace Py
{
	inline PyObject* djasgiApp = 0;
	inline PyObject* asyncToSync = 0;

	struct Object
	{
	public:
		Object(PyObject* obj) : _obj(obj) {}
		~Object() { Py_XDECREF(_obj); }

		Object(const Object&) = delete;
		Object& operator=(const Object&) = delete;

		Object(Object&& other) : _obj(other._obj) { other._obj = 0; }
		Object& operator=(Object&& other) { _obj = other._obj; other._obj = 0; return *this; }

		operator PyObject*() const { return _obj; }
		PyObject& operator->() const { return *_obj; }

		bool operator!() const { return !_obj; }

	private:
		PyObject* _obj;
	};

	bool init();
}