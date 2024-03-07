const pongVertShader = `\
#version 300 es
precision mediump float;
layout(location = 0) in vec3 position;
layout(std140) uniform ubo
{
	vec2 uposition;
	vec2 usize;
};
uniform vec2 screensize;
void main()
{
	vec2 pos = ((position.xy * usize) + uposition) / screensize * 2.0 - vec2(1.0, 1.0);
	pos.y = -pos.y;
	gl_Position = vec4(pos, 0.0, 1.0);
}
`;
const pongFragShader = `\
#version 300 es
precision mediump float;
out vec4 color;
void main()
{
	color = vec4(1, 1, 1, 1.0);
}
`;

const textVertShader = `\
#version 300 es
precision mediump float;
precision mediump int;
layout(location = 0) in vec3 position;
layout(std140) uniform strubo
{
	uvec2 uposition; // at 0 to 8
	uvec2 stringsize; // at 8 to 16
	uvec4 stringdata; // at 16 to 32
};
uniform vec2 screensize;
out vec2 fraguv;
void main()
{
	vec2 pos = vec2(position.x * float(stringsize.x), position.y);
	// fraguv = pos.xy / 7.0;
	fraguv = vec2(pos.x, pos.y);
	pos.xy = (pos.xy * 7.0 + vec2(uposition)) / screensize.xy * 2.0 - vec2(1.0, 1.0);
	// pos.y = -pos.y;
	gl_Position = vec4(pos, 0.0, 1.0);
}
`;
const textFragShader = `\
#version 300 es
precision mediump float;
precision mediump int;
layout(std140) uniform strubo
{
	uvec2 uposition; // at 0 to 8
	uvec2 stringsize; // at 8 to 16
	uvec4 stringdata; // at 16 to 32
};
in vec2 fraguv;
out vec4 color;
uniform sampler2D tex;
uniform vec2 screensize;
float charPos(uint charindex)
{
	uint char = (stringdata[charindex / uint(4)] >> (uint(8) * (charindex % uint(4)))) & uint(0xFF);
	// uint char = uint(2);
	return float(char) / float(stringsize.y) + mod(fraguv.x, 1.0) / float(stringsize.y);
}
void main()
{
	vec2 uv = vec2(charPos(uint(floor(fraguv.x)) % uint(16)), fraguv.y);
	vec4 col = vec4(texture(tex, uv).x);
	color = vec4(col);
}
`;

const screenVertShader = `\
#version 300 es
precision lowp float;
layout(location = 0) in vec3 position;
out vec2 fraguv;
vec2 uv[6] = vec2[6](
	vec2(0.0, 0.0),
	vec2(0.0, 1.0),
	vec2(1.0, 0.0),
	vec2(1.0, 0.0),
	vec2(0.0, 1.0),
	vec2(1.0, 1.0)
);
void main()
{
	gl_Position = vec4(position, 1.0);
	fraguv = uv[gl_VertexID];
}
`;
const screenFragShader = `\
#version 300 es
precision lowp float;
in vec2 fraguv;
out vec4 color;
uniform float glitch;
uniform sampler2D tex;
uniform sampler2D vignette;
uniform vec2 screensize;
#define PI 3.1415926538
vec2 scanline(vec2 uv)
{
	vec2 intensity = vec2(sin(uv.x * screensize.x * PI * 2.0 - 1.5), sin(uv.y * screensize.y * PI * 2.0 - 1.5));
	vec2 s = vec2(pow(((0.5 * intensity.x) + 0.5) * 0.9 + 0.1, 0.1), pow(((0.5 * intensity.y) + 0.5) * 0.9 + 0.1, 0.4));
	return s;
}
void main()
{
	vec2 uv = fraguv * 2.0 - 1.0;
	vec2 offset = (abs(uv.yx)) / vec2(3.0, 3.0);
	uv = uv + uv * offset * offset;
	uv = uv * 0.5 + 0.5;
	if(uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0)
	{
		color = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}
	vec2 scanlines = scanline(uv);
	uv.x += sin((floor(uv.y * 50.0)) * 32657.435) * glitch;
	// scanlines.x *= (clamp(pow(uv.x * (1.0 - uv.x) * (screensize.x/16.0), 0.8), 0.0, 1.0));
	// scanlines.y *= (clamp(pow(uv.y * (1.0 - uv.y) * (screensize.y/16.0), 0.8), 0.0, 1.0));
	color = vec4(texture(tex, uv).xyz * scanlines.x * scanlines.y * texture(vignette, uv).x * 3.0, 1.0);
}
`;

const ambientSound = new Audio('/audio/ambient.ogg');
ambientSound.loop = true;
ambientSound.volume = 0.5;
const hurtSound = new Audio('/audio/hurt.ogg');
hurtSound.volume = 0.2;
const bounceSound = new Audio('/audio/beep.ogg');
bounceSound.volume = 0.4;

export { pongVertShader, pongFragShader, textVertShader, textFragShader, screenVertShader, screenFragShader, ambientSound, hurtSound, bounceSound}
