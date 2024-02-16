const canvas = document.getElementById('webgl-canvas');
const gl = canvas.getContext('webgl2');

// const vertices = new Float32Array([
// 	0.0,  0.0,  0.0,
// 	0.0,  50.0, 0.0,
// 	50.0, 0.0,  0.0
// ]);

const pongVertShader = `\
#version 300 es
precision mediump float;
in vec3 position;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
void main()
{
	gl_Position = projection * view * model * vec4(position, 1.0);
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
in vec2 uv;
out vec2 fraguv;
vec3 verts[6] = vec3[6](
	vec3(-1.0, -1.0, 0.0),
	vec3(-1.0, 1.0, 0.0),
	vec3(1.0, -1.0, 0.0),
	vec3(1.0, -1.0, 0.0),
	vec3(-1.0, 1.0, 0.0),
	vec3(1.0, 1.0, 0.0)
);
void main()
{
	gl_Position = vec4(verts[gl_VertexID], 1.0);
	fraguv = uv;
}
`;
const screenFragShader = `\
#version 300 es
precision lowp float;
in vec2 fraguv;
out vec4 color;
uniform sampler2D tex;
#define PI 3.1415926538
vec3 scanline(float u, float res)
{
	float intensity = (sin(u * res * PI * 2.0) * 0.5 + 0.5) * 0.9 + 0.1;
	return vec3(pow(intensity, 0.5));
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
	vec3 vertscanline = scanline(uv.y, 200.0) * (clamp(pow(uv.y * (1.0 - uv.y) * (200.0/64.0), 0.3), 0.0, 1.0));
	vec3 horzscanline = scanline(uv.x, 150.0) * (clamp(pow(uv.x * (1.0 - uv.x) * (150.0/64.0), 0.3), 0.0, 1.0));
	color = vec4(texture(tex, uv).xyz * vertscanline * horzscanline, 1.0);
}
`;

const vertices = new Float32Array([
	0.0, 0.0,  0.0,
	0.0, 15.0, 0.0,
	2.0, 0.0,  0.0,
	2.0, 0.0,  0.0,
	0.0, 15.0, 0.0,
	2.0, 15.0, 0.0
]);

const screenuvs = new Float32Array([
	0.0, 0.0,
	0.0, 1.0,
	1.0, 0.0,
	1.0, 0.0,
	0.0, 1.0,
	1.0, 1.0
]);

const paddle = {
	width: 2,
	height: 15
}

var screenprogram;
var screenuvbuffer;

var buffer;
var stagelinebuffer;
var program;
var positionAttrib;
var modelUniform;
var viewMatrix;
var viewUniform;
var projectionMatrix;
var projectionUniform;

const pongrenderwidth = 800 / 8;
const pongrenderheight = 600 / 8;

var fb;
var fbtexture;
var fbdepthbuffer;

var inputs = [0, 0];

const player1 = {
	y: 0,
	modelMatrix: newPosMatrix(0.0, 0.0, 0.0)
}
const player2 = {
	y: 0,
	modelMatrix: newPosMatrix(0.0, 0.0, 0.0)
}

const ball = {
	x: 0,
	y: 0,
	width: 3,
	height: 3,
	xspeed: 0,
	yspeed: 0,
	modelMatrix: newPosMatrix(0.0, 0.0, 0.0)
}

const stage = {
	top: pongrenderheight * 0.1,
	bottom: pongrenderheight * 0.9,
	left: pongrenderwidth * 0.1,
	right: pongrenderwidth * 0.9
}

const stagelines = new Float32Array([
	stage.left, stage.top, 0.0,
	stage.left, stage.bottom + 1.0, 0.0,
	stage.right + 1.0, stage.top, 0.0,
	stage.right + 1.0, stage.bottom + 1.0, 0.0,
	stage.left - 1.0, stage.bottom + 1.0, 0.0,
	stage.right + 1.0, stage.bottom + 1.0, 0.0,
	stage.left, stage.top, 0.0,
	stage.right, stage.top, 0.0
]);

function newOrthoMatrix(left, right, bottom, top, near, far)
{
	return new Float32Array([
		2.0/(right-left), 0.0, 0.0, 0.0,
		0.0, 2.0/(top-bottom), 0.0, 0.0,
		0.0, 0.0, -2.0/(far-near), 0.0,
		-(right+left)/(right-left), -(top+bottom)/(top-bottom), -(far+near)/(far-near), 1.0
	]);
}

function newViewMatrix(x, y, z)
{
	return new Float32Array([
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		-x, -y, -z, 1.0
	]);

}

function newPosMatrix(x, y, z)
{
	return new Float32Array([
		1.0, 0.0, 0.0, 0.0,
		0.0, 1.0, 0.0, 0.0,
		0.0, 0.0, 1.0, 0.0,
		x, y, z, 1.0
	]);
}

function newScaleMatrix(x, y, z)
{
	return new Float32Array([
		x, 0.0, 0.0, 0.0,
		0.0, y, 0.0, 0.0,
		0.0, 0.0, z, 0.0,
		0.0, 0.0, 0.0, 1.0
	]);
}

function createProgram(vertexShaderSource, fragmentShaderSource)
{
	const vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader, vertexShaderSource);
	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
	{
		console.error(gl.getShaderInfoLog(vertexShader));
		return false;
	}
	const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader, fragmentShaderSource);
	gl.compileShader(fragmentShader);
	if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
	{
		console.error(gl.getShaderInfoLog(fragmentShader));
		return false;
	}
	const program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);

	return program;
}

function createBuffer(data)
{
	b = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, b);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	return b;
}

function setup()
{
	if(!gl)
	{
		console.log('WebGL2 not supported');
		return false;
	}

	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	// create framebuffer
	fb = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	fbtexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, fbtexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pongrenderwidth, pongrenderheight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	// gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	fbdepthbuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, fbdepthbuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, pongrenderwidth, pongrenderheight);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbtexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, fbdepthbuffer);
	if(gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
	{
		console.error('Framebuffer not complete');
		return false;
	}

	program = createProgram(pongVertShader, pongFragShader);
	if(!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(program));
		return false;
	}

	screenprogram = createProgram(screenVertShader, screenFragShader);
	if(!gl.getProgramParameter(screenprogram, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(screenprogram));
		return false;
	}

	gl.clearColor(0.2, 0.2, 0.25, 1.0);

	gl.useProgram(screenprogram);

	screenuvbuffer = createBuffer(screenuvs);
	uvAttrib = gl.getAttribLocation(screenprogram, 'uv');
	gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(uvAttrib);

	gl.useProgram(program);
	stagelinebuffer = createBuffer(stagelines);
	
	buffer = createBuffer(vertices);
	positionAttrib = gl.getAttribLocation(program, 'position');
	gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionAttrib);

	modelUniform = gl.getUniformLocation(program, 'model');
	viewUniform = gl.getUniformLocation(program, 'view');
	projectionUniform = gl.getUniformLocation(program, 'projection');
	if(modelUniform === -1 || viewUniform === -1 || projectionUniform === -1)
	{
		console.error('Could not bind all uniforms');
		return false;
	}

	viewMatrix = newViewMatrix(0.0, 0.0, 0.0);
	gl.uniformMatrix4fv(viewUniform, false, viewMatrix);

	projectionMatrix = newOrthoMatrix(0, pongrenderwidth, pongrenderheight, 0, -1, 1);
	gl.uniformMatrix4fv(projectionUniform, false, projectionMatrix);

	window.onkeydown = function(e)
	{
		if(e.key == 'w')
		{
			inputs[0] = 1;
		}
		else if(e.key == 's')
		{
			inputs[1] = 1;
		}
	}
	window.onkeyup = function(e)
	{
		if(e.key == 'w')
		{
			inputs[0] = 0;
		}
		else if(e.key == 's')
		{
			inputs[1] = 0;
		}
	}

	ball.x = pongrenderwidth/2 - ball.width/2;
	ball.y = pongrenderheight/2 - ball.height/2;
	ball.xspeed = -0.03;
	ball.yspeed = 0;
	ball.modelMatrix = newPosMatrix(ball.x, ball.y, 0.0);
	ball.modelMatrix[5] = ball.height / paddle.height;
	ball.modelMatrix[0] = ball.width / paddle.width;

	player1.modelMatrix[12] = stage.left;
	player1.modelMatrix[13] = stage.bottom/2-paddle.height/2;
	player2.modelMatrix[12] = stage.right-paddle.width;
	player2.modelMatrix[13] = stage.bottom/2-paddle.height/2;
	
	return true;
}

function collisionCheck(player, ball)
{ // only checks for y axis
	return ball.modelMatrix[13] < player.modelMatrix[13]+paddle.height && ball.modelMatrix[13]+ball.height > player.modelMatrix[13];
}

var lastTime = 0;
function draw()
{
	dt = (performance.now() - lastTime);
	lastTime = performance.now();
	if(!document.hasFocus())
	{
		setTimeout(function(){requestAnimationFrame(draw);}, 1000/4);
		return;
	}
	if(inputs[0] == 1)
	{
		player1.modelMatrix[13] -= 0.04 * dt;
		if(player1.modelMatrix[13] < stage.top)
			player1.modelMatrix[13] = stage.top;
	}
	if(inputs[1] == 1)
	{
		player1.modelMatrix[13] += 0.04 * dt;
		if(player1.modelMatrix[13] > stage.bottom-paddle.height)
			player1.modelMatrix[13] = stage.bottom-paddle.height;
	}

	ball.modelMatrix[12] += ball.xspeed * dt;
	ball.modelMatrix[13] += ball.yspeed * dt;

	if(ball.modelMatrix[12] <= paddle.width + stage.left)
	{
		if(collisionCheck(player1, ball))
		{
			ball.modelMatrix[12] = paddle.width + stage.left;
			ball.xspeed *= -1.05;
			ball.yspeed = (ball.modelMatrix[13]+ball.height/2 - (player1.modelMatrix[13] + paddle.height/2))/8 * ball.xspeed;
		}
		if(ball.modelMatrix[12] < stage.left)
		{
			ball.modelMatrix[12] = stage.left;
			ball.yspeed = (0.03 / -ball.xspeed) * ball.yspeed;
			ball.xspeed = 0.03;
		}
	}
	else if(ball.modelMatrix[12] > stage.right-ball.width-paddle.width)
	{
		if(collisionCheck(player2, ball))
		{
			ball.modelMatrix[12] = stage.right-ball.width-paddle.width;
			ball.xspeed *= -1.05;
			ball.yspeed = -(ball.modelMatrix[13]+ball.height/2 - (player2.modelMatrix[13] + paddle.height/2))/8 * ball.xspeed;
		}
		if(ball.modelMatrix[12] > stage.right-ball.width)
		{
			ball.modelMatrix[12] = stage.right-ball.width;
			ball.yspeed = (0.03 / ball.xspeed) * ball.yspeed;
			ball.xspeed = -0.03;
		}
	}
	if(ball.modelMatrix[13] <= stage.top)
	{
		ball.modelMatrix[13] = stage.top;
		ball.yspeed *= -1;
	}
	else if(ball.modelMatrix[13] > stage.bottom-ball.height)
	{
		ball.modelMatrix[13] = stage.bottom-ball.height;
		ball.yspeed *= -1;
	}

	if(ball.modelMatrix[13]+ball.height < player2.modelMatrix[13]+paddle.height/2-paddle.height/4)
	{
		player2.modelMatrix[13] -= 0.04 * dt;
		if(player2.modelMatrix[13] < stage.top)
			player2.modelMatrix[13] = stage.top;
	}
	else if(ball.modelMatrix[13]+ball.height > player2.modelMatrix[13]+paddle.height/2+paddle.height/4)
	{
		player2.modelMatrix[13] += 0.04 * dt;
		if(player2.modelMatrix[13] > stage.bottom-paddle.height)
			player2.modelMatrix[13] = stage.bottom-paddle.height;
	}

	gl.useProgram(program);
	gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, pongrenderwidth, pongrenderheight);
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionAttrib);
	gl.uniformMatrix4fv(modelUniform, false, player1.modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.uniformMatrix4fv(modelUniform, false, player2.modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.uniformMatrix4fv(modelUniform, false, ball.modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	gl.bindBuffer(gl.ARRAY_BUFFER, stagelinebuffer);
	gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionAttrib);
	gl.uniformMatrix4fv(modelUniform, false, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
	gl.drawArrays(gl.LINES, 0, 8);
	gl.useProgram(screenprogram);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, canvas.width, canvas.height);
	gl.bindBuffer(gl.ARRAY_BUFFER, screenuvbuffer);
	gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(uvAttrib);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	requestAnimationFrame(draw);
}

if(setup())
{
	requestAnimationFrame(draw);
}

// var ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
// ws.binaryType = "arraybuffer";
// var canvas = document.getElementById("pong-canvas");
// var ctx = canvas.getContext("2d");

// var rplayer = {y: 0, x: 0};
// var ropponent = {y: 0, x: 0};

// var player = rplayer;
// var opponent = ropponent;

// var inputs = [0, 0];

// var stockplayery = 0;

// var started = false;

// var playerid = 1;

// async function gamestart() {
// 	window.addEventListener("keydown", function (event) {
// 		switch(event.key) {
// 			case "ArrowUp":
// 				inputs[0] = 1;
// 				break;
// 			case "ArrowDown":
// 				inputs[1] = 1;
// 				break;
// 			default:
// 		}
// 	});
// 	window.addEventListener("keyup", function (event) {
// 		switch(event.key) {
// 			case "ArrowUp":
// 				inputs[0] = 0;
// 				break;
// 			case "ArrowDown":
// 				inputs[1] = 0;
// 				break;
// 			default:
// 		}
// 	});
// 	setInterval(gameloop, 1000 / 30);
// }

// function gameloop() {
// 	if(inputs[0] == 1) {
// 		player.y -= 5;
// 		if(player.y > canvas.height - 128) {
// 			player.y = canvas.height - 128;
// 		}
// 		else if(player.y < 0) {
// 			player.y = 0;
// 		}
// 	}
// 	if(inputs[1] == 1) {
// 		player.y += 5;
// 		if(player.y > canvas.height - 128) {
// 			player.y = canvas.height - 128;
// 		}
// 		else if(player.y < 0) {
// 			player.y = 0;
// 		}
// 	}
// 	ctx.fillStyle = "#000000";
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);
// 	ctx.fillStyle = "#ffffff";
// 	ctx.fillRect(0, rplayer.y, 16, 128);
// 	ctx.fillRect(canvas.width - 16, ropponent.y, 16, 128);
// 	senddata();
// }

// ws.onopen = function (event) {
// 	console.log("Websocket connection opened.");
// }

// ws.onmessage = function (event) {
// 	let dv = new DataView(event.data);
// 	let type = dv.getUint8(0);
// 	// console.log("Received data: " + type + ' ' + dv.getUint8(1));
// 	switch(type) {
// 	case 1: // player movement
// 		rplayer.y = dv.getUint32(1, true);
// 		break;
// 	case 2: // opponent movement
// 		ropponent.y = dv.getUint32(1, true);
// 		break;
// 	case 5: // gamestart
// 		if(dv.getUint8(1) == 1) {
// 			playerid = 1;
// 		}
// 		else {
// 			player = ropponent;
// 			opponent = rplayer;
// 			playerid = 2;
// 		}
// 		gamestart();
// 		console.log("Game started.");
// 		break;
// 	default:
// 	}
// }

// function senddata() {
// 	if(player.y != stockplayery)
// 	{
// 		let a = new ArrayBuffer(5);
// 		let v = new DataView(a);
// 		v.setUint8(0, playerid);
// 		v.setUint32(1, player.y, true);
// 		stockplayery = player.y;
// 		// console.log("Sending data: " + player.y);
// 		ws.send(a);
// 	}
// }

// function ping() {
// 	let a = new ArrayBuffer(8);
// 	let v = new DataView(a);
// 	v.setUint8(0, 2);
// 	v.setUint32(1, Date.now(), true);
// 	ws.send(a);
// }
