#include "player.hpp"

Player::Player() noexcept {
}

Player::~Player() {
}

///////////////////////
// Python interface
///////////////////////

struct PlayerObject
{
	PyObject_HEAD
	Player* player;
};

PyObject* Player::pynew(PyTypeObject* type, PyObject* args, PyObject* kwds) {
	PlayerObject* self = (PlayerObject*)type->tp_alloc(type, 0);
	if(self != 0)
		self->player = 0;
	return (PyObject*)self;
}

int Player::pyinit(Player* self, PyObject* args, PyObject* kwds) {
	PlayerObject* const o = (PlayerObject*)self;
	o->player = (Player*)PyObject_Malloc(sizeof(Player));
	if(!o->player) {
		PyErr_SetString(PyExc_MemoryError, "Could not allocate memory for Player");
		return -1;
	}
	new(o->player) Player();
	return 0;
}

void Player::pydealloc(Player* self) {
	PlayerObject* const o = (PlayerObject*)self;
	if(o->player) {
		o->player->~Player();
		PyObject_Free(o->player);
		o->player = 0;
	}
	Py_TYPE(self)->tp_free((PyObject*)self);
}
