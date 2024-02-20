const canvas = document.getElementById('webgl-canvas');

// var ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
// ws.binaryType = "arraybuffer";

const paddle = {
	width: 2,
	height: 10
}

var program;
var textprogram
var screenprogram;

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

state = 0;

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

	ambientSound.play();

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

	return true;
}

function collisionCheck(player, ball)
{ // only checks for y axis
	return ball.gety() < player.gety()+paddle.height && ball.gety()+ball.height > player.gety();
}

var lastTime = 0;
var redtimer = 0;
var ratio = 0.0;
var sendtimer = 0.0;
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
		player1.sety(player1.gety() - 0.04 * dt);
		if(player1.gety() < stage.top)
			player1.sety(stage.top);
	}
	if(inputs[1] == 1)
	{
		player1.sety(player1.gety() + 0.04 * dt);
		if(player1.gety() > stage.bottom-paddle.height)
			player1.sety(stage.bottom-paddle.height);
	}

	ball.setx(ball.getx() + ball.xspeed * dt);
	ball.sety(ball.gety() + ball.yspeed * dt);

	if(ball.getx() <= paddle.width + stage.left)
	{
		if(collisionCheck(player1, ball))
		{ // bounce
			ball.setx(paddle.width + stage.left);
			ball.xspeed *= -1.05;
			ball.yspeed = (ball.gety()+ball.height/2 - (player1.gety() + paddle.height/2))/8 * ball.xspeed;
			bounceSound.currentTime = 0;
			bounceSound.play();
		}
		if(ball.getx() < stage.left)
		{ // out of bounds
			ball.setx(stage.left);
			ball.yspeed = (0.03 / -ball.xspeed) * ball.yspeed;
			ball.xspeed = 0.03;
			score.points[1] += 1;
			score.ubo2.setdata([
				score.points[1] % 10 << 8 | score.points[1] / 10 << 0
			]);
			redtimer = 200;
			hurtSound.currentTime = 0;
			hurtSound.playbackRate = Math.random() * 0.4 + 0.8;
			hurtSound.play();
		}
	}
	else if(ball.getx() > stage.right-ball.width-paddle.width)
	{
		if(collisionCheck(player2, ball))
		{
			ball.setx(stage.right-ball.width-paddle.width);
			ball.xspeed *= -1.05;
			ball.yspeed = -(ball.gety()+ball.height/2 - (player2.gety() + paddle.height/2))/8 * ball.xspeed;
			bounceSound.currentTime = 0;
			bounceSound.play();
		}
		if(ball.getx() > stage.right-ball.width)
		{
			ball.setx(stage.right-ball.width);
			ball.yspeed = (0.03 / ball.xspeed) * ball.yspeed;
			ball.xspeed = -0.03;
			score.points[0] += 1;
			score.ubo1.setdata([
				score.points[0] % 10 << 8 | score.points[0] / 10 << 0
			]);
			redtimer = 200;
			hurtSound.currentTime = 0;
			hurtSound.playbackRate = Math.random() * 0.6 + 0.7;
			hurtSound.play();
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

	// if(ball.modelMatrix[13]+ball.height < player2.modelMatrix[13]+paddle.height/2-paddle.height/4)
	// {
	// 	player2.modelMatrix[13] -= 0.04 * dt;
	// 	if(player2.modelMatrix[13] < stage.top)
	// 		player2.modelMatrix[13] = stage.top;
	// }
	// else if(ball.modelMatrix[13]+ball.height > player2.modelMatrix[13]+paddle.height/2+paddle.height/4)
	// {
	// 	player2.modelMatrix[13] += 0.04 * dt;
	// 	if(player2.modelMatrix[13] > stage.bottom-paddle.height)
	// 		player2.modelMatrix[13] = stage.bottom-paddle.height;
	// }

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
	// sendtimer += dt;
	// if(sendtimer > 1000/30)
	// {
	// 	senddata();
	// 	sendtimer = 0;
	// }

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
	// gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
	// gl.enableVertexAttribArray(positionAttrib);
	stagelineVAO.bind();
	pongUBO.update(stage._ubodata);
	gl.drawArrays(gl.LINES, 0, 8);

	gl.useProgram(screenprogram);
	gl.uniform1f(glitchUniform, ratio * ratio * 0.2);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	// gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.viewport(0, 0, canvas.width, canvas.height);
	screenVAO.bind();
	// gl.bindBuffer(gl.ARRAY_BUFFER, screenuvbuffer);
	// gl.vertexAttribPointer(uvAttrib, 2, gl.FLOAT, false, 0, 0);
	// gl.enableVertexAttribArray(uvAttrib);
	gl.drawArrays(gl.TRIANGLES, 0, 6);

	requestAnimationFrame(draw);
}

if(setup())
{
	requestAnimationFrame(draw);
}
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
