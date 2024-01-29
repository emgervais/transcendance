var roomName = 'room';
const chatSocket = new WebSocket(
	'wss://'
	+ window.location.host
	+ '/ws/chat/'
	+ roomName + '/'
);
/*
	Use request.user


*/
document.querySelector('#chat-message-submit').onclick = function(e) {
	const messageInputDom = document.querySelector('#chat-message-input');
	const message = messageInputDom.value;
	chatSocket.send(JSON.stringify({
		'message': message
	}));
	messageInputDom.value = '';
};

chatSocket.onmessage = function(e) {
	const data = JSON.parse(e.data);
	document.querySelector('#chat-log').value += (data.message + '\n');
};

chatSocket.onclose = function(e) {
	console.error('Chat socket closed unexpectedly');
};

document.querySelector('#chat-message-input').focus();
document.querySelector('#chat-message-input').onkeyup = function(e) {
	const ENTER = 13;
	if (e.keyCode === ENTER) {
		document.querySelector('#chat-message-submit').click();
	}
};


