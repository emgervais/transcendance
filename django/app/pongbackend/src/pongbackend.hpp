#pragma once

#ifdef __APPLE__
#ifndef __x86_64__
#define __x86_64__
#endif
#include "include/Python.h"
#include "include/structmember.h"
#else
#define PY_SSIZE_T_CLEAN
// #include <Python.h>
#include <python3.11/Python.h>
#include <python3.11/structmember.h>
#endif

inline PyObject* PongObjectType = NULL;
inline PyObject* PlayerObjectType = NULL;
