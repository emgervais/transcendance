#include "player.hpp"

#include "pong.hpp"
#include "uid.hpp"

Player::Player()
{
	printf("Player constructed\n");
	_y = 0;
}
Player::~Player()
{
	printf("Player destructed\n");
}

///////////////////////
// Python interface
///////////////////////

PyObject* PlayerObject::pyremove(PyObject* self, PyObject* args) {
	PlayerObject* const o = (PlayerObject*)self;
	PongGame::removePlayer(o->id);
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
