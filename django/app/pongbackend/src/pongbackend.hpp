#pragma once

#ifdef __APPLE__
#ifndef __x86_64__
#define __x86_64__
#endif
#include "include/Python.h"
#else
#define PY_SSIZE_T_CLEAN
#include <Python.h>
#endif
