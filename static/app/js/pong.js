var ws = new WebSocket("wss://" + window.location.host + "/ws/pong/");
var canvas = document.getElementById("pong-canvas");
var ctx = canvas.getContext("2d");

var playerid = 0;
var playery = 0;
var ff = 1.56;

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
    let a = new ArrayBuffer(8);
    playery += 16;
    let v = new DataView(a);
    v.setUint32(0, playery, true);
    v.setFloat32(4, ff, true);
    ws.send(a);
}
