from setuptools import Extension, setup

setup(
	name='pong',
	ext_modules=[Extension(
		name='pong',
		extra_compile_args=['-std=c++20', '-g'],
		sources=[
			'src/pongbackend.cpp',
			'src/pong.cpp',
			'src/player.cpp',
			'src/pyWrapper.cpp'
		])],
)
