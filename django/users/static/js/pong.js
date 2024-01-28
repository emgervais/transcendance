var ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
var canvas = document.getElementById("pong-canvas");
var ctx = canvas.getContext("2d");

var playerid = 0;

ws.onopen = function (event) {
    console.log("Websocket connection opened.");
}

ws.onmessage = function (event) {
    console.log(event);
    e = JSON.parse(event.data);
    switch(e.type) {
        case "player_id":
            playerid = e.player_id;
            break;
        default:
            console.log("Unknown message type: " + e.type);
    }
}

let i = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "30px Arial";
    ctx.strokeText(playerid.toString(), 10, 50);
    ctx.beginPath();
    ctx.arc(100 + i, 75, 50, 0, 2 * Math.PI);
    ctx.stroke();
    i++;
}

function waitforplayerid() {
    if (playerid == 0) {
        setTimeout(waitforplayerid, 1);
    }
}

waitforplayerid();

setInterval(draw, 10);
