import {newModel, createProgram, newProjectionMatrix, newViewMatrix, newTranslationMatrix, newRotationMatrix, newScaleMatrix, createStaticBuffer, createVAO, unbindVAO, createUBO, createTexture, createFramebuffer, initGL, gl} from "/js/pong/webgl.js";
import {modelVertShader, modelFragShader, pongVertShader, pongFragShader, textVertShader, textFragShader, screenVertShader, screenFragShader, ambientSound, bounceSound, hurtSound} from "/js/pong/res.js";
// import * as params from "/js/router/params.js";
// import * as router from "/js/router/router.js";
// import * as util from "/js/util.js";
import { cancelSearchingMatch } from "/js/pong/match.js";

import * as chatMessages from "/js/chat/messages.js";
import * as chat from "/js/chat/chat.js";
import * as util from "/js/util.js";
import * as match from "/js/pong/match.js";
import * as notifications from "/js/notifications.js";

var ws = null;
var canvas;

var soundspeed = 1.0;

var inGame = true;

var pongUBO;
var textUBO;
var pongVAO;
var stagelineVAO;
var screenVAO;

var digitsTexture;
var winTexture;
var digitstexuniform;
// var fontTexture;
var vignetteTexture;

var mainUBO;

var tvmodel;
var legmodel;
var sandalmodel;
var boxmodel;
var traymodel;
var cassettemodel;

const wsmovementbuffer = new ArrayBuffer(5);
const wsmovementdv = new DataView(wsmovementbuffer);
wsmovementdv.setUint8(0, 1);

const wsscorebuffer = new ArrayBuffer(17);
const wsscoredv = new DataView(wsscorebuffer);
wsscoredv.setUint8(0, 2);

const wsballbuffer = new ArrayBuffer(17);
const wsballdv = new DataView(wsballbuffer);
wsballdv.setUint8(0, 3);

const ballprecision = 1000.0;

const paddle = {
	width: 2,
	height: 8
}

var program;
var textprogram
var screenprogram;
var modelprogram;

var playerid = 0;

var glitchUniform;

const pongrenderwidth = 80;
const pongrenderheight = 55;

var fb;

const camera = {
	pitch: 0,
	yaw: -Math.PI/2,
	targetpitch: 0,
	targetyaw: -Math.PI/2,
	x: 0,
	y: 0,
	z: 1.5,
	fov: Math.PI / 2,
	targetfov: Math.PI / 2,
	targetz: 1.5,
	_viewmatrix: 0,
	_projectionmatrix: 0,
	uploadV: function() {mainUBO.update(this._viewmatrix._matrix, 192);},
	uploadP: function() {mainUBO.update(this._projectionmatrix._matrix, 256);},
	move: function(x, y, z, pitch, yaw) {this._viewmatrix.update(x, y, z, pitch, yaw);},
	proj: function(fov, aspect, near, far) {this._projectionmatrix.update(fov, aspect, near, far);}
}

const screenobject = {
	_uboT: 0,
	_uboR: 0,
	_uboS: 0,
	move: function(x, y, z) {this._uboT.update(x, y, z);},
	rotate: function(pitch, yaw, roll) {this._uboR.update(pitch, yaw, roll);},
	scale: function(x, y, z) {this._uboS.update(x, y, z);},
	uploadT: function() {mainUBO.update(this._uboT._matrix);},
	uploadR: function() {mainUBO.update(this._uboR._matrix, 64);},
	uploadS: function() {mainUBO.update(this._uboS._matrix, 128);}
}

const inputs = [0, 0, 0, 0, 0, 0, 0, 0];

var wintext = {
	ubo: {
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
				this._ubodata[4 + i] = data[i];
		},
		setwinnder: function(winner) {
			if(winner == 1)
			{
				this.setdata([
					8 << 0 | 6 << 8 | 0 << 16 | 1 << 24, 
					2 << 0 | 3 << 8 | 4 << 16 | 5 << 24
				]);
			}
			else
			{
				this.setdata([
					0 << 0 | 1 << 8 | 2 << 16 | 3 << 24,
					4 << 0 | 5 << 8 | 6 << 16 | 7 << 24
				]);
			}
		}
	}
}

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
				this._ubodata[4 + i] = data[i];
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
				this._ubodata[4 + i] = data[i];
		}
	}
}

var countdowntext = {
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
			this._ubodata[4 + i] = data[i];
	}
}

var player = 0;
var state = 0; // states: 0=pong waiting to start, 1=pong playing, 2=pong player 1 win, 3=pong player 2 win
// 4=game select 5=countdown
var countdown = 0;

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
	canvas = document.getElementById('webgl-canvas');
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

	program = createProgram(pongVertShader, pongFragShader);
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

	textprogram = createProgram(textVertShader, textFragShader);
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
	// textUBO.update(score.ubo1._ubodata);
	score.ubo2.setpos(pongrenderwidth / 2 + 6, stage.bottom - 9);
	score.ubo2.setstrlen(2);
	score.ubo2.settexlen(10);
	score.ubo2.setdata([0]);
	// textUBO.update(score.ubo2._ubodata);
	countdowntext.setpos(pongrenderwidth / 2 - 4, pongrenderheight / 2 - 13);
	countdowntext.setstrlen(1);
	countdowntext.settexlen(10);
	countdowntext.setdata([3]);
	// textUBO.update(countdowntext._ubodata);


	digitsTexture = createTexture('/img/digits.png', gl.R8, gl.RED, 2);
	winTexture = createTexture('/img/win.png', gl.R8, gl.RED, 3);
	digitstexuniform = gl.getUniformLocation(textprogram, 'tex');
	gl.uniform1i(digitstexuniform, 2);

	wintext.ubo.setpos(pongrenderwidth / 2 - 28, pongrenderheight / 2 - 10);
	wintext.ubo.setstrlen(8);
	wintext.ubo.settexlen(9);
	// wintext.ubo.setdata([
	// 	0 | 1 << 8 | 2 << 16 | 3 << 24,
	// 	4 | 5 << 8
	// ]);

	fb.bindTexture();

	// fontTexture = createTexture('/img/font.png', gl.RGBA, gl.RGBA, 0);
	// const fontTexUniform = gl.getUniformLocation(textprogram, 'tex');
	// gl.uniform1i(fontTexUniform, 3);

	screenprogram = createProgram(screenVertShader, screenFragShader);
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
		-1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, -1.0, -1.0,
		1.0, -1.0, -1.0,
		-1.0, 1.0, -1.0,
		1.0, 1.0, -1.0
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

	mainUBO = createUBO('mvp', screenprogram, 2);
	mainUBO.bindToProgram(screenprogram);

	screenobject._uboT = newTranslationMatrix(0, 0, 8);
	screenobject._uboR = newRotationMatrix(0, 0, 0);
	screenobject._uboS = newScaleMatrix(1.3, 1, 1);
	screenobject.move(0, 0, 1.36);
	screenobject.uploadT();
	screenobject.uploadR();
	screenobject.uploadS();

	modelprogram = createProgram(modelVertShader, modelFragShader);
	if(!gl.getProgramParameter(modelprogram, gl.LINK_STATUS))
	{
		console.error(gl.getProgramInfoLog(modelprogram));
		return false;
	}
	gl.useProgram(modelprogram);
	mainUBO.bindToProgram(modelprogram);
	const texuni = gl.getUniformLocation(modelprogram, 'tex');
	if(!texuni)
	{
		console.error('Could not get uniform location for tex');
		return false;
	}
	gl.uniform1i(texuni, 0);

	tvmodel = newModel('/obj/tv.obj', '/img/tv.png');
	legmodel = newModel('/obj/leg.obj', '/img/leg.png');
	sandalmodel = newModel('/obj/sandal.obj', '/img/sandal.png');
	boxmodel = newModel('/obj/box.obj', '/img/co.png');
	traymodel = newModel('/obj/tray.obj', '/img/tray.png');
	cassettemodel = newModel('/obj/CPONG.obj', '/img/PONG.png');

	tvmodel.move(0, 0, 0.0);
	legmodel.move(0, 0, 0.0);
	sandalmodel.move(0, 0, 0.0);
	boxmodel.move(0, 0, 0.0);
	traymodel.move(0, 0, 0.0);
	cassettemodel.move(2.60782, -2.22583, 1.64862);
	cassettemodel.rotate(0, 0.5, 0);
	let modelscales = 2.15;
	tvmodel.scale(modelscales, modelscales + 0.2, modelscales);
	legmodel.scale(modelscales, modelscales + 0.2, modelscales);
	sandalmodel.scale(modelscales, modelscales + 0.2, modelscales);
	boxmodel.scale(modelscales, modelscales + 0.2, modelscales);
	traymodel.scale(modelscales, modelscales + 0.2, modelscales);
	cassettemodel.scale(modelscales, modelscales + 0.2, modelscales);

	camera._viewmatrix = newViewMatrix(0, 0, 2, 0, Math.PI*2);
	camera._projectionmatrix = newProjectionMatrix(camera.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0);
	camera.uploadV();
	camera.uploadP();

	vignetteTexture = createTexture('/img/vignette.png', gl.R8, gl.RED, 1);

	// gl.useProgram(program);
	// stagelinebuffer = createStaticBuffer(stagelines);

	window.onmousemove = function(e)
	{
		if(state == 4)
		{
			let x = Math.min(Math.max(((e.clientX - canvas.offsetLeft) / canvas.clientWidth) * 2 - 1, -0.9), 0.9);
			let y = Math.min(Math.max(((e.clientY - canvas.offsetTop) / canvas.clientHeight) * -2 + 1, -0.75), 0.75);
			camera.targetyaw = -Math.PI/2 + (x * Math.PI / 2);
			camera.targetpitch = y * Math.PI / 2;
		}
	}

	window.onkeydown = function(e)
	{
		if(e.key == 'w')
			inputs[0] = 1;
		else if(e.key == 's')
			inputs[1] = 1;
		else if(e.key == 'a')
			inputs[2] = 1;
		else if(e.key == 'd')
			inputs[3] = 1;
		else if(e.key == 'ArrowUp')
			inputs[4] = 1;
		else if(e.key == 'ArrowDown')
			inputs[5] = 1;
		else if(e.key == 'ArrowLeft')
			inputs[6] = 1;
		else if(e.key == 'ArrowRight')
			inputs[7] = 1;
		else if(e.key == ' ' && state != 1)
		{
			state = (state == 4) ? 0 : 4;
			setViewState();
		}
			
	}
	window.onkeyup = function(e)
	{
		if(e.key == 'w')
			inputs[0] = 0;
		else if(e.key == 's')
			inputs[1] = 0;
		else if(e.key == 'a')
			inputs[2] = 0;
		else if(e.key == 'd')
			inputs[3] = 0;
		else if(e.key == 'ArrowUp')
			inputs[4] = 0;
		else if(e.key == 'ArrowDown')
			inputs[5] = 0;
		else if(e.key == 'ArrowLeft')
			inputs[6] = 0;
		else if(e.key == 'ArrowRight')
			inputs[7] = 0;
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

	ambientSound.play();

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	// connect('0');

	return true;
}

function setViewState()
{
	if(state == 4)
	{
		// game select state
		inGame = false;
		match.clearPongText();
		util.displayState();
		if(ws)
			ws.close();
		cancelSearchingMatch();
		camera.targetfov = Math.PI * 0.4;
		camera.targetz = 3;
		playerid = 0;
		player = 0;
		ambientSound.preservesPitch = false;
		soundspeed = 0.8;
	}
	else
	{
		soundspeed = 1.0;
		inGame = true;
		util.displayState();
		camera.targetfov = Math.PI / 2;
		camera.targetz = 1.5;
		camera.targetpitch = 0;
		camera.targetyaw = -Math.PI/2;
	}
}

var tourney = 0;
function connect(id, tournamentId)
{
	if(state == 4)
	{
		state = 0;
		setViewState();
	}
	inGame = (tournamentId == null);
	tourney = tournamentId != null;
	if(tournamentId.split('_').length == 5)
		tourney = 0;
	util.displayState();
	if(ws)
		ws.close();
	// console.log("Connecting to websocket ID " + id);
	ws = new WebSocket("wss://" + window.location.host + "/ws/pong/" + id + "/");
	if(!ws)
	{
		console.error('Failed to connect to websocket');
		return false;
	}
	ws.binaryType = "arraybuffer";
	ws.onopen = function (event) {
		console.log("Websocket connection opened.");
	}
	ws.onmessage = function (event) {
		let dv = new DataView(event.data);
		let offset = 0;
		// console.log("Received data: " + dv.getUint8(0));
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
				if(playerid == 1 && dv.getUint32(offset, true) > score.points[0])
				{
					redtimer = 200;
					hurtSound.currentTime = 0;
					hurtSound.playbackRate = Math.random() * 0.4 + 0.8;
					hurtSound.play();
				}
				score.points[0] = dv.getUint32(offset, true);
				score.ubo1.setdata([
					score.points[0] % 10 << 8 | score.points[0] / 10 << 0
				]);
				offset += 4;
				break;
			case 4: // player 2 score
				if(playerid == 2 && dv.getUint32(offset, true) > score.points[1])
				{
					redtimer = 200;
					hurtSound.currentTime = 0;
					hurtSound.playbackRate = Math.random() * 0.4 + 0.8;
					hurtSound.play();
				}
				score.points[1] = dv.getUint32(offset, true);
				score.ubo2.setdata([
					score.points[1] % 10 << 8 | score.points[1] / 10 << 0
				]);
				offset += 4;
				break;
			case 5: // ball hit
				const pl = dv.getUint8(offset);
				ball.setx(dv.getUint32(offset + 1, true) / ballprecision);
				ball.sety(dv.getUint32(offset + 5, true) / ballprecision);
				ball.xspeed = dv.getInt32(offset + 9, true) / ballprecision;
				ball.yspeed = dv.getInt32(offset + 13, true) / ballprecision;
				offset += 17;
				if(pl != playerid)
				{
					bounceSound.currentTime = 0;
					bounceSound.play();
				}
				break;
			case 8: // gamestate
				if(dv.getUint8(offset) == 1) {
					playerid = 1;
					player = player1;
					// console.log("You are player 1.");
					wsmovementdv.setUint32(1, player.gety(), true);
					if(ws.readyState == ws.OPEN)
						ws.send(wsmovementbuffer);
				}
				else if(dv.getUint8(offset) == 2){
					playerid = 2;
					player = player2;
					// console.log("You are player 2.");
					wsmovementdv.setUint32(1, player.gety(), true);
					if(ws.readyState == ws.OPEN)
						ws.send(wsmovementbuffer);
				}
				else if(dv.getUint8(offset) == 3) {
					state = 5; // start countdown
					countdown = 3;
					// console.log("Game started.");
					wsmovementdv.setUint32(1, player.gety(), true);
					if(ws.readyState == ws.OPEN)
						ws.send(wsmovementbuffer);
				}
				else if(dv.getUint8(offset) == 4)
				{
					inGame = true && !tourney;
					util.displayState();
					state = dv.getUint8(offset + 1) + 1;
					wintext.ubo.setwinnder(state - 1);
					console.log("Game ended, Winner: P" + (state - 1));
					offset += 1;
					ball.setx(pongrenderwidth/2.0 - ball.width/2.0);
					ball.sety(pongrenderheight/2.0 - ball.height/2.0);
					ball.xspeed = 0;
					ball.yspeed = 0;
					if (tournamentId && (state - 1) == playerid)
						notifications.nextGame(tournamentId);
				}
				else if(dv.getUint8(offset) == 5)
				{
					// console.log("state " + state);
					countdown = dv.getUint8(offset + 1);
					offset += 1;
					countdowntext.setdata([countdown]);
					// console.log("Countdown:" + countdown);
					if(countdown == 0)
						state = 1;
				}
				else
				{
					disconnect();
				}
				offset += 1;
				break;
			default:
				offset = dv.byteLength; // stop processing
				break;
			}
		}
	}
}

function drawpong()
{
	gl.activeTexture(gl.TEXTURE0);
	fb.bind();
	fb.bindTexture();
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, pongrenderwidth, pongrenderheight);

	// draw the scores and countdown
	// drawText('press space', x, y);
	digitsTexture.bind();
	pongVAO.bind();
	gl.useProgram(textprogram);
	textUBO.update(score.ubo1._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	textUBO.update(score.ubo2._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	if(state == 5)
	{
		textUBO.update(countdowntext._ubodata);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	if((state == 2 || state == 3) && lastTime % 1000 < 800)
	{
		textUBO.update(wintext.ubo._ubodata);
		gl.uniform1i(digitstexuniform, 3);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.uniform1i(digitstexuniform, 2);
	}
	// draw the pong game
	gl.useProgram(program);
	if(state || playerid == 1 || lastTime % 1000 < 500)
	{
		pongUBO.update(player1._ubodata);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	if(state || playerid == 2 || lastTime % 1000 < 500)
	{
		pongUBO.update(player2._ubodata);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	pongUBO.update(ball._ubodata);
	gl.drawArrays(gl.TRIANGLES, 0, 6);
	stagelineVAO.bind();
	pongUBO.update(stage._ubodata);
	gl.drawArrays(gl.LINES, 0, 8);
}

function collisionCheck(player, ball)
{ // only checks for y axis
	return ball.gety() < player.gety()+paddle.height && ball.gety()+ball.height > player.gety();
}

function senddata(sendbytes)
{
	if(sendbytes[0] == 1 && ws.readyState == ws.OPEN)
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
var stopgame = 0;
function draw()
{
	if(stopgame)
		return;
	const sendbytes = new Uint32Array(1); // 0: player1 movement, rest is sent instantly
	let dt = (performance.now() - lastTime);
	lastTime = performance.now();
	switch(state)
	{
	case 1:
	case 2:
	case 3:
	case 5:
		if(countdown <= 0)
		{
			ball.setx(ball.getx() + ball.xspeed * dt);
			ball.sety(ball.gety() + ball.yspeed * dt);
	
			if((playerid == 1 && (ball.xspeed < 0.0) && (ball.getx() <= stage.left + paddle.width)) || (playerid == 2 && (ball.xspeed > 0.0) && (ball.getx() > stage.right-ball.width-paddle.width)))
			{
				if(collisionCheck(player, ball))
				{ // ball bounce
					ball.setx((playerid == 1) ? stage.left + paddle.width : stage.right-ball.width-paddle.width);
					ball.xspeed *= -1.05;
					ball.yspeed = (ball.gety()+ball.height/2 - (player.gety() + paddle.height/2))*0.5 * Math.abs(ball.xspeed);
					bounceSound.currentTime = 0;
					bounceSound.play();
					wsballdv.setUint32(1, ball.getx() * ballprecision, true);
					wsballdv.setUint32(5, ball.gety() * ballprecision, true);
					wsballdv.setUint32(9, ball.xspeed * ballprecision, true);
					wsballdv.setUint32(13, ball.yspeed * ballprecision, true);
					ws.send(wsballbuffer);
				}
				else if(playerid == 1 && ball.getx() < stage.left)
				{ // ouch owie
					ball.setx(stage.left + 0.1);
					ball.yspeed = (0.03 / -ball.xspeed) * ball.yspeed;
					ball.xspeed = 0.03;
					score.points[1] += 1;
					score.ubo2.setdata([
						score.points[1] % 10 << 8 | score.points[1] / 10 << 0
					]);
					miss();
				}
				else if(playerid == 2 && ball.getx() > stage.right-ball.width)
				{
					ball.setx(stage.right-ball.width - 0.1);
					ball.yspeed = (0.03 / ball.xspeed) * ball.yspeed;
					ball.xspeed = -0.03;
					score.points[0] += 1;
					score.ubo1.setdata([
						score.points[0] % 10 << 8 | score.points[0] / 10 << 0
					]);
					miss();
				}
			}
	
			if(ball.gety() <= stage.top)
			{
				ball.sety(stage.top + 0.1);
				ball.yspeed *= -1;
			}
			else if(ball.gety() > stage.bottom-ball.height)
			{
				ball.sety(stage.bottom-ball.height);
				ball.yspeed *= -1;
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
		}
	case 0:
		if(player)
		{
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
		}
		if(camera.fov != camera.targetfov)
		{
			camera.fov += (camera.targetfov - camera.fov) * 0.002 * dt;
			if(Math.abs(camera.fov - camera.targetfov) < 0.001)
				camera.fov = camera.targetfov;
			camera.proj(camera.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0);
			camera.uploadP();
		}
		if(camera.z != camera.targetz)
		{
			camera.z += (camera.targetz - camera.z) * 0.002 * dt;
			if(Math.abs(camera.z - camera.targetz) < 0.001)
				camera.z = camera.targetz;
		}
		if(camera.pitch != camera.targetpitch)
		{
			camera.pitch += (camera.targetpitch - camera.pitch) * 0.004 * dt;
			if(Math.abs(camera.pitch - camera.targetpitch) < 0.003)
				camera.pitch = camera.targetpitch;
		}
		if(camera.yaw != camera.targetyaw)
		{
			camera.yaw += (camera.targetyaw - camera.yaw) * 0.004 * dt;
			if(Math.abs(camera.yaw - camera.targetyaw) < 0.003)
				camera.yaw = camera.targetyaw;
		}
		camera.move(camera.x, camera.y, camera.z, camera.pitch, camera.yaw);
		camera.uploadV();
		sendtimer += dt;
		if(sendtimer > 1000/30)
		{
			senddata(sendbytes);
			sendtimer = 0;
		}
		unbindVAO();
		drawpong();
		// draw the pong screen
		mainUBO.bind();
		gl.useProgram(screenprogram);
		screenobject.uploadT();
		screenobject.uploadR();
		screenobject.uploadS();
		mainUBO.update(camera._viewmatrix._matrix, 192);
		mainUBO.update(camera._projectionmatrix._matrix, 256);
		gl.uniform1f(glitchUniform, ratio * ratio * 0.2);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		// camera.move(0, 0, -2, camera.pitch, camera.yaw);
		// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		screenVAO.bind();
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		// draw the models
		gl.useProgram(modelprogram);
		gl.enable(gl.DEPTH_TEST);
		// gl.clearColor(0.0, 0.0, 0.0, 1.0);
		// gl.clear(gl.COLOR_BUFFER_BIT);
		tvmodel.draw(mainUBO);
		legmodel.draw(mainUBO);
		sandalmodel.draw(mainUBO);
		boxmodel.draw(mainUBO);
		traymodel.draw(mainUBO);
		if(ambientSound.playbackRate != soundspeed)
		{
			ambientSound.playbackRate += (soundspeed - ambientSound.playbackRate) * 0.001 * dt;
			if(Math.abs(ambientSound.playbackRate - soundspeed) < 0.001)
				ambientSound.playbackRate = soundspeed;
		}
		break;
	case 4:
		if(camera.pitch != camera.targetpitch)
		{
			camera.pitch += (camera.targetpitch - camera.pitch) * 0.004 * dt;
			if(Math.abs(camera.pitch - camera.targetpitch) < 0.003)
				camera.pitch = camera.targetpitch;
		}
		if(camera.yaw != camera.targetyaw)
		{
			camera.yaw += (camera.targetyaw - camera.yaw) * 0.004 * dt;
			if(Math.abs(camera.yaw - camera.targetyaw) < 0.003)
				camera.yaw = camera.targetyaw;
		}
		if(camera.fov != camera.targetfov)
		{
			camera.fov += (camera.targetfov - camera.fov) * 0.001 * dt;
			if(Math.abs(camera.fov - camera.targetfov) < 0.001)
				camera.fov = camera.targetfov;
			camera.proj(camera.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0);
			camera.uploadP();
		}
		if(camera.z != camera.targetz)
		{
			camera.z += (camera.targetz - camera.z) * 0.001 * dt;
			if(Math.abs(camera.z - camera.targetz) < 0.001)
				camera.z = camera.targetz;
		}
		if(inputs[0] == 1)
		{
			camera.pitch += 0.001 * dt;
			if(camera.pitch > Math.PI * 0.5)
				camera.pitch = Math.PI * 0.5;
		}
		if(inputs[1] == 1)
		{
			camera.pitch -= 0.001 * dt;
			if(camera.pitch < -Math.PI * 0.5)
				camera.pitch = -Math.PI * 0.5;
		}
		if(inputs[2] == 1)
		{
			camera.yaw -= 0.001 * dt;
			if(camera.yaw < -Math.PI * 0.75)
				camera.yaw = -Math.PI * 0.75;
		}
		if(inputs[3] == 1)
		{
			camera.yaw += 0.001 * dt;
			if(camera.yaw > -Math.PI * 0.25)
				camera.yaw = -Math.PI * 0.25;
		}
		camera.move(camera.x, camera.y, camera.z, camera.pitch, camera.yaw);
		gl.activeTexture(gl.TEXTURE0);
		fb.bindTexture();
		mainUBO.bind();
		gl.useProgram(screenprogram);
		screenobject.uploadT();
		screenobject.uploadR();
		screenobject.uploadS();
		mainUBO.update(camera._viewmatrix._matrix, 192);
		mainUBO.update(camera._projectionmatrix._matrix, 256);
		gl.uniform1f(glitchUniform, Math.random() * 0.03 + 0.05);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, canvas.width, canvas.height);
		screenVAO.bind();
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		gl.useProgram(modelprogram);
		gl.enable(gl.DEPTH_TEST);
		tvmodel.draw(mainUBO);
		legmodel.draw(mainUBO);
		sandalmodel.draw(mainUBO);
		boxmodel.draw(mainUBO);
		traymodel.draw(mainUBO);
		cassettemodel.draw(mainUBO);
		if(ambientSound.playbackRate != soundspeed)
		{
			ambientSound.playbackRate += (soundspeed - ambientSound.playbackRate) * 0.001 * dt;
			if(Math.abs(ambientSound.playbackRate - soundspeed) < 0.001)
				ambientSound.playbackRate = soundspeed;
		}
		break;
	}

	requestAnimationFrame(draw);
}

function miss() {
	redtimer = 200;
	hurtSound.currentTime = 0;
	hurtSound.playbackRate = Math.random() * 0.4 + 0.8;
	hurtSound.play();
	wsscoredv.setUint32(1, ball.getx() * ballprecision, true);
	wsscoredv.setUint32(5, ball.gety() * ballprecision, true);
	wsscoredv.setUint32(9, ball.xspeed * ballprecision, true);
	wsscoredv.setUint32(13, ball.yspeed * ballprecision, true);
	ws.send(wsscorebuffer);
}

function start()
{
	console.log('Starting pong');
	stopgame = 0;
	countdown = 0;
	playerid = 0;
	// canvas = document.getElementById('webgl-canvas');
	if(!setup())
	{
		console.error('Failed to set up pong');
		return;
	}
	drawpong();
	state = 4;
	camera.targetfov = Math.PI * 0.4;
	camera.targetz = 3;
	camera.targetpitch = 0;
	camera.targetyaw = -Math.PI/2;
	camera.fov = camera.targetfov;
	camera.z = camera.targetz;
	camera.pitch = camera.targetpitch;
	camera.yaw = camera.targetyaw;
	camera.proj(camera.fov, canvas.clientWidth / canvas.clientHeight, 0.1, 100.0);
	requestAnimationFrame(draw);
}

function stop()
{
	ambientSound.pause();
	if (ws && (ws.readyState !== WebSocket.CLOSING || ws.readyState !== WebSocket.CLOSED)) {
		ws.close();
	}
	inGame = true;
	util.displayState();
	stopgame = 1;
	state = 0;
}

function disconnect()
{
	if(ws)
	{
		ws.close();
		ws = 0;
	}
	state = 0;
	playerid = 0;
	player = 0;
	inGame = true;
	util.displayState();
}

export {start, stop, stopgame, connect, disconnect, inGame};
