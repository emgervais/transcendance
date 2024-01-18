wss = new WebSocket("wss://" + window.location.host + "/ws/pong/");

wss.onmessage = function (event) {
    var data = JSON.parse(event.data);
   
    console.log(data);
}
