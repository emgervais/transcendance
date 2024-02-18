const pongVertShader = `\
#version 300 es
precision mediump float;
in vec3 position;
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
uniform vec2 screensize;
#define PI 3.1415926538
vec2 scanline(vec2 uv)
{
	vec2 intensity = vec2(sin(uv.x * screensize.x * PI * 4.0 - 1.0), sin(uv.y * screensize.y * 4.0 * PI * 2.0 - 0.6));
	vec2 s = vec2(pow(((0.5 * intensity.x) + 0.5) * 0.9 + 0.1, 0.5), pow(((0.5 * intensity.y) + 0.5) * 0.9 + 0.1, 0.5));
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
	uv.x += sin(43758.5453 * (floor(uv.y * 20.0))) * glitch;
	vec2 scanlines = scanline(uv);
	scanlines.x *= (clamp(pow(uv.x * (1.0 - uv.x) * (screensize.x/16.0), 0.8), 0.0, 1.0));
	scanlines.y *= (clamp(pow(uv.y * (1.0 - uv.y) * (screensize.y/16.0), 0.8), 0.0, 1.0));
	// vec3 vertscanline = scanline(uv.y, 200.0) * (clamp(pow(uv.y * (1.0 - uv.y) * (200.0/16.0), 0.8), 0.0, 1.0));
	// vec3 horzscanline = scanline(uv.x, 150.0) * (clamp(pow(uv.x * (1.0 - uv.x) * (150.0/16.0), 0.8), 0.0, 1.0));
	color = vec4(texture(tex, uv).xyz * scanlines.x * scanlines.y * 2.0, 1.0);
}
`;

// const vertices = new Float32Array([
// 	0.0, 0.0,  0.0,
// 	0.0, 15.0, 0.0,
// 	2.0, 0.0,  0.0,
// 	2.0, 0.0,  0.0,
// 	0.0, 15.0, 0.0,
// 	2.0, 15.0, 0.0
// ]);

const screenverts = new Float32Array([
	-1.0,  1.0, 0.0,
	-1.0, -1.0, 0.0,
	 1.0,  1.0, 0.0,
	 1.0,  1.0, 0.0,
	-1.0, -1.0, 0.0,
	 1.0, -1.0, 0.0
]);

var pongUBO;
var pongVAO;
var stagelineVAO;
var screenVAO;

// const pongUBOData = new Float32Array([
// 	0.0, 0.0, // position
// 	1.0, 1.0 // size
// ]);

const ambientSound = new Audio('static/app/sound/ambient.ogg');
ambientSound.loop = true;
ambientSound.volume = 0.5;
const hurtSound = new Audio('static/app/sound/hurt.ogg');
hurtSound.volume = 0.2;
const bounceSound = new Audio('static/app/sound/beep.ogg');
bounceSound.volume = 0.4;