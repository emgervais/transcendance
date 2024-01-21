#pragma once

#include "common.hpp"

#include <stdlib.h>
#include <time.h>

//#define UIDUSE128

#ifdef UIDUSE128

class UID128
{
public:
	UID128() = default;
	UID128(u32 embededvalue) { _id32[0] = embededvalue; _id32[1] = rand(); _id64[1] = (u64)time(0); }

	bool operator==(const UID128& other) const { return _id64[0] == other._id64[0] && _id64[1] == other._id64[1]; }
	bool operator!=(const UID128& other) const { return _id64[0] != other._id64[0] || _id64[1] != other._id64[1]; }

	bool operator<(const UID128& other) const { return _id64[0] < other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] < other._id64[1]); }
	bool operator>(const UID128& other) const { return _id64[0] > other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] > other._id64[1]); }
	bool operator<=(const UID128& other) const { return _id64[0] <= other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] <= other._id64[1]); }
	bool operator>=(const UID128& other) const { return _id64[0] >= other._id64[0] || (_id64[0] == other._id64[0] && _id64[1] >= other._id64[1]); }

	static UID128 from128(u64 id1, u64 id2) { UID128 uid; uid._id64[0] = id1; uid._id64[1] = id2; return uid; }

private:
	union
	{
		u64 _id64[2];
		u32 _id32[4];
	};
};

typedef UID128 UID;

#else

class UID64
{
public:
	UID64() = default;
	UID64(u16 embededvalue) { _id16[0] = embededvalue; _id16[1] = (u16)rand(); _id32[1] = (u32)time(0); }

	bool operator==(const UID64& other) const { return _id64 == other._id64; }
	bool operator!=(const UID64& other) const { return _id64 != other._id64; }

	bool operator<(const UID64& other) const { return _id64 < other._id64; }
	bool operator>(const UID64& other) const { return _id64 > other._id64; }
	bool operator<=(const UID64& other) const { return _id64 <= other._id64; }
	bool operator>=(const UID64& other) const { return _id64 >= other._id64; }

	operator u64() const { return _id64; }

	static UID64 from64(u64 id) { UID64 uid; uid._id64 = id; return uid; }

private:
	union
	{
		u64 _id64;
		u32 _id32[2];
		u16 _id16[4];
	};
};

typedef UID64 UID;

#endif
