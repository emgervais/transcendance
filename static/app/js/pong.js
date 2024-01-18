const ws = new WebSocket("wss://localhost/ws/pong/");

ws.addEventListener("open", () => {
  ws.send("Hello Server!");
});

ws.addEventListener("message", (event) => {
	console.log(event.data);
});
