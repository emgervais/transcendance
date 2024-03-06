import * as shaders from "/js/pong/shaders.js";
import * as sounds from "/js/pong/sounds.js";
import { gl } from "/js/pong/webgl.js";
import { createProgram, createStaticBuffer, createVAO, unbindVAO } from "/js/pong/webgl.js";
import { createUBO, createTexture, createFramebuffer } from "/js/pong/webgl.js";
import { initGL } from "/js/pong/webgl.js";

var ws;

var pongUBO;
var textUBO;
var pongVAO;
var stagelineVAO;
var screenVAO;

var vignetteTexture;
var digitsTexture;


// -- Websocket ----
function startWs() {
	ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
	ws.binaryType = "arraybuffer";
    ws.onerror = function(error) {
        // throw new Error("WebSocket connection error: " + (error && error.message ? error.message : "Unknown error"));
    };
}

var wsmovementbuffer = new ArrayBuffer(5);
var wsmovementdv = new DataView(wsmovementbuffer);
wsmovementdv.setUint8(0, 1);

var wsscorebuffer = new ArrayBuffer(17);
var wsscoredv = new DataView(wsscorebuffer);
wsscoredv.setUint8(0, 2);

var wsballbuffer = new ArrayBuffer(17);
var wsballdv = new DataView(wsballbuffer);
wsballdv.setUint8(0, 3);

var ballprecision = 1000.0;

const paddle = {
	width: 2,
	height: 10
}

var program;
var textprogram
var screenprogram;

var playerid = 0;

var glitchUniform;

const pongrenderwidth = 80;
const pongrenderheight = 55;

var fb;
var fbtexture;
var fbdepthbuffer;

var inputs = [0, 0];
var scoredata1 = new Uint32Array([
	0, 0, // position
	0, // char count in string
	0, // number of chars in texture
	0, 0, 0, 0 // string data
]);

var score = {
	points: [0, 0],
	ubo1: {
		_ubodata: new Uint32Array([
			0, 0, // position
			0, // char count in string
			0, // number of chars in texture
			0, 0, 0, 0 // string data
		]),
		setpos: function(x, y) {this._ubodata[0] = x; this._ubodata[1] = y;},
		setstrlen: function(len) {this._ubodata[2] = len;},
		settexlen: function(len) {this._ubodata[3] = len;},
		setdata: function(data) {
			for(var i = 0; i < data.length; i++)
			{
				this._ubodata[4 + i] = data[i];
			}
		}
	},
	ubo2: {
		_ubodata: new Uint32Array([
			0, 0, // position
			0, // char count in string
			0, // number of chars in texture
			0, 0, 0, 0 // string data
		]),
		setpos: function(x, y) {this._ubodata[0] = x; this._ubodata[1] = y;},
		setstrlen: function(len) {this._ubodata[2] = len;},
		settexlen: function(len) {this._ubodata[3] = len;},
		setdata: function(data) {
			for(var i = 0; i < data.length; i++)
			{
				this._ubodata[4 + i] = data[i];
			}
		}
	}
}

var player = 0;
var state = 0;

const player1 = {
	_ubodata: new Float32Array([0.0, 0.0, paddle.width, paddle.height]),
	getx: function() {return this._ubodata[0];},
	setx: function(x) {this._ubodata[0] = x;},
	gety: function() {return this._ubodata[1];},
	sety: function(y) {this._ubodata[1] = y;},
	setsize: function(x, y) {this._ubodata[2] = x; this._ubodata[3] = y;}
}
const player2 = {
	_ubodata: new Float32Array([0.0, 0.0, paddle.width, paddle.height]),
	getx: function() {return this._ubodata[0];},
	setx: function(x) {this._ubodata[0] = x;},
	gety: function() {return this._ubodata[1];},
	sety: function(y) {this._ubodata[1] = y;},
	setsize: function(x, y) {this._ubodata[2] = x; this._ubodata[3] = y;}
}

const ball = {
	_ubodata: new Float32Array([0.0, 0.0, 3.0, 3.0]),
	getx: function() {return this._ubodata[0];},
	setx: function(x) {this._ubodata[0] = x;},
	gety: function() {return this._ubodata[1];},
	sety: function(y) {this._ubodata[1] = y;},
	setsize: function(x, y) {this._ubodata[2] = x; this._ubodata[3] = y;},
	xspeed: 0,
	yspeed: 0,
	width: 2,
	height: 2
}

const stage = {
	_ubodata: new Float32Array([0.0, 0.0, 1.0, 1.0]),
	top: pongrenderheight * 0.1,
	bottom: pongrenderheight * 0.9,
	left: pongrenderwidth * 0.1,
	right: pongrenderwidth * 0.9,
	width: pongrenderwidth * 0.9 - pongrenderwidth * 0.1,
	height: pongrenderheight * 0.9 - pongrenderheight * 0.1
}

function setup()
{
	startWs();

	const canvas = document.getElementById('webgl-canvas');
	if(!initGL(canvas))
		return false;

	canvas.width = canvas.clientWidth;
	canvas.height = canvas.clientHeight;

	// create framebuffer
	gl.activeTexture(gl.TEXTURE0);
	fb = createFramebuffer(pongrenderwidth, pongrenderheight);
	if(!fb)
	{
		console.error('Could not create framebuffer');
		return false;
	}
	fb.bindTexture();

	program = createProgram(shaders.pongVert, shaders.pongFrag);
	if(!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(program));
		return false;
	}
	gl.useProgram(program);
	const screensizeuniform = gl.getUniformLocation(program, 'screensize');
	gl.uniform2f(screensizeuniform, pongrenderwidth, pongrenderheight);

	// create ubo
	pongUBO = createUBO('ubo', program, 0);
	pongUBO.bindToProgram(program);

	textprogram = createProgram(shaders.textVert, shaders.textFrag);
	if(!gl.getProgramParameter(textprogram, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(textprogram));
		return false;
	}
	gl.useProgram(textprogram);
	const screensizeuniformtext = gl.getUniformLocation(textprogram, 'screensize');
	gl.uniform2f(screensizeuniformtext, pongrenderwidth, pongrenderheight);

	textUBO = createUBO('strubo', textprogram, 1);
	textUBO.bindToProgram(textprogram);

	score.ubo1.setpos(pongrenderwidth / 2 - 20, stage.bottom - 9);
	score.ubo1.setstrlen(2);
	score.ubo1.settexlen(10);
	score.ubo1.setdata([0]);
	textUBO.update(score.ubo1._ubodata);
	score.ubo2.setpos(pongrenderwidth / 2 + 6, stage.bottom - 9);
	score.ubo2.setstrlen(2);
	score.ubo2.settexlen(10);
	score.ubo2.setdata([0]);
	textUBO.update(score.ubo2._ubodata);

	digitsTexture = createTexture('/static/app/img/digits.png', gl.R8, gl.RED, 2);
	const digitstexuniform = gl.getUniformLocation(textprogram, 'tex');
	gl.uniform1i(digitstexuniform, 2);

	fb.bindTexture();

	screenprogram = createProgram(shaders.screenVert, shaders.screenFrag);
	if(!gl.getProgramParameter(screenprogram, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(screenprogram));
		return false;
	}

	gl.clearColor(0.1, 0.1, 0.14, 1.0);
	
	pongVAO = createVAO();
	pongVAO.addBuffer(createStaticBuffer(new Float32Array([
		0.0, 0.0, 0.0,
		0.0, 1.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		0.0, 1.0, 0.0,
		1.0, 1.0, 0.0
	])), 0, 3, gl.FLOAT, false, 0, 0);
	
	screenVAO = createVAO();
	screenVAO.addBuffer(createStaticBuffer(new Float32Array([
		-1.0, -1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, -1.0, 0.0,
		1.0, -1.0, 0.0,
		-1.0, 1.0, 0.0,
		1.0, 1.0, 0.0
	])), 0, 3, gl.FLOAT, false, 0, 0);
	
	stagelineVAO = createVAO();
	stagelineVAO.addBuffer(createStaticBuffer(new Float32Array([
		stage.left - 0.5, stage.top, 0.0,
		stage.left - 0.5, stage.bottom + 0.5, 0.0,
		stage.right + 0.5, stage.top, 0.0,
		stage.right + 0.5, stage.bottom + 0.5, 0.0,
		stage.left - 0.5, stage.bottom + 0.5, 0.0,
		stage.right + 1.5, stage.bottom + 0.5, 0.0,
		stage.left - 0.5, stage.top, 0.0,
		stage.right + 1.5, stage.top, 0.0
	])), 0, 3, gl.FLOAT, false, 0, 0);
	
	gl.useProgram(screenprogram);
	glitchUniform = gl.getUniformLocation(screenprogram, 'glitch');
	const texUniform = gl.getUniformLocation(screenprogram, 'tex');
	const vignetteUniform = gl.getUniformLocation(screenprogram, 'vignette');
	const screensizeuniform2 = gl.getUniformLocation(screenprogram, 'screensize');
	gl.uniform2f(screensizeuniform2, pongrenderwidth * 4, pongrenderheight * 4);
	gl.uniform1f(glitchUniform, 0.0);
	gl.uniform1i(texUniform, 0);
	gl.uniform1i(vignetteUniform, 1);

	vignetteTexture = createTexture('/static/app/img/vignette.png', gl.R8, gl.RED, 1);

	// gl.useProgram(program);
	// stagelinebuffer = createStaticBuffer(stagelines);

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

	ball.setx(pongrenderwidth/2.0 - ball.width/2.0);
	ball.sety(pongrenderheight/2.0 - ball.height/2.0);
	ball.xspeed = -0.03;
	ball.yspeed = 0;
	ball.setsize(2.0, 2.0);

	player1.setsize(paddle.width, paddle.height);
	player2.setsize(paddle.width, paddle.height);
	player1.setx(stage.left);
	player2.setx(stage.right-paddle.width);
	player1.sety(pongrenderheight/2-paddle.height/2);
	player2.sety(pongrenderheight/2-paddle.height/2);

	sounds.ambient.play();

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	ws.onopen = function (event) {
		console.log("Websocket connection opened.");
	}
	ws.onmessage = function (event) {
		let dv = new DataView(event.data);
		let offset = 0;
		console.log("Received data: " + dv.getUint8(0));
		while(offset < dv.byteLength) {
			let type = dv.getUint8(offset);
			offset += 1;
			switch(type) {
			case 1: // player movement
				if(playerid != 1) {
					player1.sety(dv.getUint32(offset, true));
				}
				offset += 4;
				break;
			case 2: // opponent movement
				if(playerid != 2) {
					player2.sety(dv.getUint32(offset, true));
				}
				offset += 4;
				break;
			case 3: // player1 score
				score.points[0] = dv.getUint32(offset, true);
				score.ubo1.setdata([
					score.points[0] % 10 << 8 | score.points[0] / 10 << 0
				]);
				offset += 4;
				if(playerid == 1)
				{
					redtimer = 200;
					sounds.hurt.currentTime = 0;
					sounds.hurt.playbackRate = Math.random() * 0.4 + 0.8;
					sounds.hurt.play();
				}
				break;
			case 4: // player 2 score
				score.points[1] = dv.getUint32(offset, true);
				score.ubo2.setdata([
					score.points[1] % 10 << 8 | score.points[1] / 10 << 0
				]);
				offset += 4;
				if(playerid == 2)
				{
					redtimer = 200;
					sounds.hurt.currentTime = 0;
					sounds.hurt.playbackRate = Math.random() * 0.4 + 0.8;
					sounds.hurt.play();
				}
				break;
			case 5: // ball hit
				ball.setx(dv.getUint32(offset, true) / ballprecision);
				ball.sety(dv.getUint32(offset + 4, true) / ballprecision);
				ball.xspeed = dv.getInt32(offset + 8, true) / ballprecision;
				ball.yspeed = dv.getInt32(offset + 12, true) / ballprecision;
				offset += 16;
				if(!redtimer && (ball.xspeed > 0 && playerid == 2 || ball.xspeed < 0 && playerid == 1))
				{
					sounds.bounce.currentTime = 0;
					sounds.bounce.play();
				}
				break;
			case 8: // gamestart
				if(dv.getUint8(offset) == 1) {
					playerid = 1;
					player = player1;
				}
				else if(dv.getUint8(offset) == 2){
					playerid = 2;
					player = player2;
				}
				else {
					playerid = 0;
					player = 0;
					state = 0;
					break;
				}
				offset += 1;
				state = 1;
				console.log("Game started.");
				break;
			default:
				offset = dv.byteLength; // stop processing
				break;
			}
		}
	}

	return true;
}

function collisionCheck(player, ball)
{ // only checks for y axis
	return ball.gety() < player.gety()+paddle.height && ball.gety()+ball.height > player.gety();
}

function senddata(sendbytes)
{
	if(sendbytes[0] == 1)
	{
		wsmovementdv.setUint32(1, player.gety(), true);
		ws.send(wsmovementbuffer);
		sendbytes[0] = 0;
	}
}

var lastTime = 0;
var redtimer = 0;
var ratio = 0.0;
var sendtimer = 0.0;
function draw()
{
	const sendbytes = new Uint32Array(1); // 0: player1 movement, rest is sent instantly
	dt = (performance.now() - lastTime);
	lastTime = performance.now();
	if(state)
	{
		// const opponent = (playerid == 1) ? player2 : player1;
		if(inputs[0] == 1)
		{
			player.sety(player.gety() - 0.04 * dt);
			if(player.gety() < stage.top)
				player.sety(stage.top);
			sendbytes[0] = 1;
		}
		if(inputs[1] == 1)
		{
			player.sety(player.gety() + 0.04 * dt);
			if(player.gety() > stage.bottom-paddle.height)
				player.sety(stage.bottom-paddle.height);
			sendbytes[0] = 1;
		}

		ball.setx(ball.getx() + ball.xspeed * dt);
		ball.sety(ball.gety() + ball.yspeed * dt);

		if((playerid == 1 && (ball.getx() <= stage.left + paddle.width)) || (playerid == 2 && (ball.getx() > stage.right-ball.width-paddle.width)))
		{
			if(collisionCheck(player, ball))
			{ // ball bounce
				ball.setx((playerid == 1) ? stage.left + paddle.width : stage.right-ball.width-paddle.width);
				ball.xspeed *= -1.05;
				ball.yspeed = (ball.gety()+ball.height/2 - (player.gety() + paddle.height/2))/8 * Math.abs(ball.xspeed);
				sounds.bounce.currentTime = 0;
				sounds.bounce.play();
				wsballdv.setUint32(1, ball.getx() * ballprecision, true);
				wsballdv.setUint32(5, ball.gety() * ballprecision, true);
				wsballdv.setUint32(9, ball.xspeed * ballprecision, true);
				wsballdv.setUint32(13, ball.yspeed * ballprecision, true);
				ws.send(wsballbuffer);
			}
			else if(playerid == 1 && ball.getx() < stage.left)
			{ // ouch owie
				ball.setx(stage.left);
				ball.yspeed = (0.03 / -ball.xspeed) * ball.yspeed;
				ball.xspeed = 0.03;
				score.points[1] += 1;
				score.ubo2.setdata([
					score.points[1] % 10 << 8 | score.points[1] / 10 << 0
				]);
				redtimer = 200;
				sounds.hurt.currentTime = 0;
				sounds.hurt.playbackRate = Math.random() * 0.4 + 0.8;
				sounds.hurt.play();
				wsscoredv.setUint32(1, ball.getx() * ballprecision, true);
				wsscoredv.setUint32(5, ball.gety() * ballprecision, true);
				wsscoredv.setUint32(9, ball.xspeed * ballprecision, true);
				wsscoredv.setUint32(13, ball.yspeed * ballprecision, true);
				ws.send(wsscorebuffer);
			}
			else if(playerid == 2 && ball.getx() > stage.right-ball.width)
			{
				ball.setx(stage.right-ball.width);
				ball.yspeed = (0.03 / ball.xspeed) * ball.yspeed;
				ball.xspeed = -0.03;
				score.points[0] += 1;
				score.ubo1.setdata([
					score.points[0] % 10 << 8 | score.points[0] / 10 << 0
				]);
				redtimer = 200;
				sounds.hurt.currentTime = 0;
				sounds.hurt.playbackRate = Math.random() * 0.4 + 0.8;
				sounds.hurt.play();
				wsscoredv.setUint32(1, ball.getx() * ballprecision, true);
				wsscoredv.setUint32(5, ball.gety() * ballprecision, true);
				wsscoredv.setUint32(9, ball.xspeed * ballprecision, true);
				wsscoredv.setUint32(13, ball.yspeed * ballprecision, true);
				ws.send(wsscorebuffer);
			}
		}

		if(ball.gety() <= stage.top)
		{
			ball.sety(stage.top);
			ball.yspeed *= -1;
		}
		else if(ball.gety() > stage.bottom-ball.height)
		{
			ball.sety(stage.bottom-ball.height);
			ball.yspeed *= -1;
		}
	
		sendtimer += dt;
		if(sendtimer > 1000/30)
		{
			senddata(sendbytes);
			sendtimer = 0;
		}
	}

	if(redtimer > 0)
	{
		redtimer -= dt;
		if(redtimer < 0)
		{
			gl.clearColor(0.1, 0.1, 0.14, 1.0);
			ratio = 0.0;
		}
		else
		{
			ratio = redtimer/200;
			gl.clearColor(0.8 * ratio + 0.1 * (1.0 - ratio), 0.1, 0.14, 1.0);
		}
	}

	// draw the paddles
	fb.bind();
	// fb.bindTexture();
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, pongrenderwidth, pongrenderheight);

	// draw the scores
	pongVAO.bind();
	gl.useProgram(textprogram);
	textUBO.update(score.ubo1._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	textUBO.update(score.ubo2._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	gl.useProgram(program);
	pongUBO.update(player1._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	pongUBO.update(player2._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	pongUBO.update(ball._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	stagelineVAO.bind();
	pongUBO.update(stage._ubodata);
	gl.drawArrays(gl.LINES, 0, 8);

	gl.useProgram(screenprogram);
	gl.uniform1f(glitchUniform, ratio * ratio * 0.2);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.viewport(0, 0, canvas.width, canvas.height);
	screenVAO.bind();
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	requestAnimationFrame(draw);
}

function main() {
	try {
		if(setup())
		{
			requestAnimationFrame(draw);
		}
	} catch (error) {
		console.log("Game crashed:", error);
	}
}

export { main };

// var canvas = document.getElementById("pong-canvas");
// var ctx = canvas.getContext("2d");

// var rplayer = {y: 0, x: 0};
// var ropponent = {y: 0, x: 0};

// var player = rplayer;
// var opponent = ropponent;

// var inputs = [0, 0];

// var stockplayery = 0;

// var started = false;

// var playerid = 0;

// var serverball = {x: 400, y: 300, vx: 0, vy: 0};
// var ball = {x: 400, y: 300, vx: 0, vy: 0};

// var count = 0;

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
	
// 	ball.x += ball.vx;
// 	ball.y += ball.vy;
// 	if(ball.y < 8) {
// 		ball.y = 8 + (8 - ball.y);
// 		ball.vy = -ball.vy;
// 	}
// 	else if(ball.y > canvas.height - 8) {
// 		ball.y = canvas.height - 8 - (ball.y - canvas.height + 8);
// 		ball.vy = -ball.vy;
// 	}
// 	if(ball.x < 16 && ball.x > 8 && ball.y > player.y && ball.y < player.y + 128) {
// 		ball.x = 16 + (16 - ball.x);
// 		ball.vx = -ball.vx;
// 	}

// 	ctx.fillStyle = "#000000";
// 	ctx.fillRect(0, 0, canvas.width, canvas.height);
// 	ctx.fillStyle = "#ffffff";
// 	ctx.fillRect(0, rplayer.y, 16, 128);
// 	ctx.fillRect(canvas.width - 16, ropponent.y, 16, 128);
// 	ctx.beginPath();
// 	ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
// 	ctx.fill();
// 	senddata();
// }

// ws.onopen = function (event) {
// 	console.log("Websocket connection opened.");
// }

// ws.onmessage = function (event) {
// 	let dv = new DataView(event.data);
// 	let offset = 0;
// 	console.log("Received data: " + dv.getUint8(0));
// 	while(offset < dv.byteLength) {
// 		let type = dv.getUint8(offset);
// 		offset += 1;
// 		// console.log("Received data: " + type + ' ' + dv.getUint8(1));
// 		switch(type) {
// 		case 1: // player movement
// 			if(playerid != 1) {
// 				rplayer.y = dv.getUint32(offset, true);
// 			}
// 			offset += 4;
// 			break;
// 		case 2: // opponent movement
// 			if(playerid != 2) {
// 				ropponent.y = dv.getUint32(offset, true);
// 			}
// 			offset += 4;
// 			break;
// 		case 3: // ball movement
// 			serverball.x = dv.getUint32(offset, true);
// 			serverball.y = dv.getUint32(offset + 4, true);
// 			offset += 8;
// 			break;
// 		case 4: // ball hit
// 			serverball.x = dv.getUint32(offset, true);
// 			serverball.y = dv.getUint32(offset + 4, true);
// 			serverball.vx = dv.getInt32(offset + 8, true);
// 			serverball.vy = dv.getInt32(offset + 12, true);
// 			offset += 16;
// 			ball.x = serverball.x;
// 			ball.y = serverball.y;
// 			ball.vx = serverball.vx;
// 			ball.vy = serverball.vy;
// 			break;
// 		case 5: // gamestart
// 			if(dv.getUint8(offset) == 1) {
// 				playerid = 1;
// 			}
// 			else {
// 				player = ropponent;
// 				opponent = rplayer;
// 				playerid = 2;
// 			}
// 			offset += 1;
// 			gamestart();
// 			console.log("Game started.");
// 			break;
// 		default:
// 			offset = dv.byteLength; // stop processing
// 			break;
// 		}
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
// 		ws.send(a);
// 	}
// }

