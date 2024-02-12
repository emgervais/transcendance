var ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
ws.binaryType = "arraybuffer";
var canvas = document.getElementById("pong-canvas");
var ctx = canvas.getContext("2d");

var rplayer = {y: 0, x: 0};
var ropponent = {y: 0, x: 0};

var player = rplayer;
var opponent = ropponent;

var inputs = [0, 0];

var stockplayery = 0;

var started = false;

var playerid = 1;

async function gamestart() {
	window.addEventListener("keydown", function (event) {
		switch(event.key) {
			case "ArrowUp":
				inputs[0] = 1;
				break;
			case "ArrowDown":
				inputs[1] = 1;
				break;
			default:
		}
	});
	window.addEventListener("keyup", function (event) {
		switch(event.key) {
			case "ArrowUp":
				inputs[0] = 0;
				break;
			case "ArrowDown":
				inputs[1] = 0;
				break;
			default:
		}
	});
	setInterval(gameloop, 1000 / 30);
}

function gameloop() {
	if(inputs[0] == 1) {
		player.y -= 5;
		if(player.y > canvas.height - 128) {
			player.y = canvas.height - 128;
		}
		else if(player.y < 0) {
			player.y = 0;
		}
	}
	if(inputs[1] == 1) {
		player.y += 5;
		if(player.y > canvas.height - 128) {
			player.y = canvas.height - 128;
		}
		else if(player.y < 0) {
			player.y = 0;
		}
	}
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, rplayer.y, 16, 128);
	ctx.fillRect(canvas.width - 16, ropponent.y, 16, 128);
	senddata();
}

ws.onopen = function (event) {
	console.log("Websocket connection opened.");
}

ws.onmessage = function (event) {
	let dv = new DataView(event.data);
	let type = dv.getUint8(0);
	// console.log("Received data: " + type + ' ' + dv.getUint8(1));
	switch(type) {
	case 1: // player movement
		rplayer.y = dv.getUint32(1, true);
		break;
	case 2: // opponent movement
		ropponent.y = dv.getUint32(1, true);
		break;
	case 5: // gamestart
		if(dv.getUint8(1) == 1) {
			playerid = 1;
		}
		else {
			player = ropponent;
			opponent = rplayer;
			playerid = 2;
		}
		gamestart();
		console.log("Game started.");
		break;
	default:
	}
}

function senddata() {
	if(player.y != stockplayery)
	{
		let a = new ArrayBuffer(5);
		let v = new DataView(a);
		v.setUint8(0, playerid);
		v.setUint32(1, player.y, true);
		stockplayery = player.y;
		// console.log("Sending data: " + player.y);
		ws.send(a);
	}
}

function ping() {
	let a = new ArrayBuffer(8);
	let v = new DataView(a);
	v.setUint8(0, 2);
	v.setUint32(1, Date.now(), true);
	ws.send(a);
}
