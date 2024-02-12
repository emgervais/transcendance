#pragma once

#include "common.hpp"

enum FilthValue : u64
{
	PLAYER1_Y = 0,
	PLAYER2_Y,
	BALL_POS,
	FILTH_MAX
};

class FilthMap
{
public:
	static inline bool isFilthy(const u64&& value)
	{
		return _filthmap[value / 64] & (1ULL << (value % 64));
	}
	static inline void setFilthy(const u64&& value)
	{
		_filthmap[value / 64] |= (1ULL << (value % 64));
	}
	static inline void cleanFilth()
	{
		for(u64 i = 0; i < sizeof(_filthmap) / sizeof(_filthmap[0]); ++i)
			_filthmap[i] = 0;
	}
private:
	inline static u64 _filthmap[FILTH_MAX / 64 + 1] = {0};
};
