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
	gl_Position = vec4(pos, 0.9, 1.0);
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
precision mediump float;
layout(location = 0) in vec3 position;
out vec2 fraguv;
layout(std140) uniform mvp
{
	mat4 modelT;
	mat4 modelR;
	mat4 modelS;
	mat4 view;
	mat4 projection;
};
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
	gl_Position = projection * view * modelT * modelR * modelS * vec4(position, 1.0);
	fraguv = uv[gl_VertexID];
}
`;
const screenFragShader = `\
#version 300 es
precision mediump float;
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
	vec2 s = vec2(1.0, pow(((0.5 * intensity.y) + 0.5) * 0.9 + 0.1, 0.5));
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

const modelVertShader = `\
#version 300 es
precision mediump float;
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;
layout(std140) uniform mvp
{
	mat4 modelT;
	mat4 modelR;
	mat4 modelS;
	mat4 view;
	mat4 projection;
};
out vec2 fraguv;
out float shade;
vec3 lightdir = normalize(vec3(0.0, 1.0, 0.0));
void main()
{
	vec4 wp = modelT * modelR * modelS * vec4(position, 1.0);
	gl_Position = projection * view * wp;
	fraguv = uv;
	// shade = max(dot(normal, lightdir), 0.0) * 0.5 + 1.0 - min(distance(wp.xyz, vec3(0.0, 0.0, 1.36)) * 0.07, 1.3);
	float dist = distance(wp.xyz, vec3(0.0, 0.0, 0.0)) * 0.1;
	shade = max((dot(normal, normalize(-wp.xyz)) + 1.0) * 0.4 + 0.7 - dist * dist, 0.0);
	// shade = (shade * shade);
}
`;
const modelFragShader = `\
#version 300 es
precision mediump float;
in vec2 fraguv;
in float shade;
out vec4 color;
uniform sampler2D tex;
vec3 lightdir = normalize(vec3(0.0, 1.0, 0.0));
float posterize = 8.0;
void main()
{
	// color = vec4(texture(tex, fraguv).xyz * shade, 1.0);
	vec3 c = texture(tex, fraguv).xyz;
	color = vec4(floor(c.x * shade * posterize) / posterize, floor(c.y * shade * posterize) / posterize, floor(c.z * shade * posterize) / posterize, 1.0) * vec4(0.89, 0.89, 1.0, 1.0);
}
`;

const ambientSound = new Audio('/audio/ambient.ogg');
ambientSound.loop = true;
ambientSound.volume = 0.5;
const hurtSound = new Audio('/audio/hurt.ogg');
hurtSound.volume = 0.2;
const bounceSound = new Audio('/audio/beep.ogg');
bounceSound.volume = 0.62;

export {modelVertShader, modelFragShader, pongVertShader, pongFragShader, textVertShader, textFragShader, screenVertShader, screenFragShader, ambientSound, hurtSound, bounceSound}
