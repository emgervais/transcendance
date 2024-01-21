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
        case "log":
            console.log(e.message);
            break;
        default:
            console.log("Unknown message type: " + e.type);
    }
}

function ping() {
    ws.send(JSON.stringify({
        type: "ping",
        message: "ping"
    }));
}
