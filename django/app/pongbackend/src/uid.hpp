#pragma once

#include "common.hpp"

#include <stdlib.h>
#include <time.h>

class UID128
{
public:
	UID128(u32 embededvalue = 0) { _id32[0] = embededvalue; _id32[1] = rand(); _id64[1] = (u64)time(0); }

	bool operator==(const UID128& other) const { return _id64[0] == other._id64[0] && _id64[1] == other._id64[1]; }
	bool operator!=(const UID128& other) const { return _id64[0] != other._id64[0] || _id64[1] != other._id64[1]; }

	bool operator<(const UID128& other) const { return _id64[0] < other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] < other._id64[1]); }
	bool operator>(const UID128& other) const { return _id64[0] > other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] > other._id64[1]); }
	bool operator<=(const UID128& other) const { return _id64[0] <= other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] <= other._id64[1]); }
	bool operator>=(const UID128& other) const { return _id64[0] >= other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] >= other._id64[1]); }

private:
	union
	{
		u64 _id64[2];
		u32 _id32[4];
	};
};

class UID64
{
public:
	UID64(u16 embededvalue = 0) { _id16[0] = embededvalue; _id16[1] = (u16)rand(); _id32[1] = (u32)time(0); }

	bool operator==(const UID64& other) const { return _id64 == other._id64; }
	bool operator!=(const UID64& other) const { return _id64 != other._id64; }

	bool operator<(const UID64& other) const { return _id64 < other._id64; }
	bool operator>(const UID64& other) const { return _id64 > other._id64; }
	bool operator<=(const UID64& other) const { return _id64 <= other._id64; }
	bool operator>=(const UID64& other) const { return _id64 >= other._id64; }

private:
	union
	{
		u64 _id64;
		u32 _id32[2];
		u16 _id16[4];
	};
};
