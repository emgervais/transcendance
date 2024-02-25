import * as util from "/js/util.js";

var chatSocket;

function toggleDisplay() {
	const id = "chat-widget";
	util.toggleDisplay(id);
}

function submit() {
	const messageInputDom = document.querySelector('#chat-message-input');
	const message = messageInputDom.value;
	chatSocket.send(JSON.stringify({
		'message': message,
		'room_id': 'global' 
	}));
	messageInputDom.value = '';
}

// --------------------------------
function initChat() {
	var roomName = 'global';
	chatSocket = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomName + '/'	// Room name according to user's friends
	);

	chatSocket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		document.getElementById('chat-log').value += (data.message + '\n');
	};

	chatSocket.onclose = (_) => {
		console.error('Chat socket closed unexpectedly');
	};

	document.getElementById('chat-message-input').focus();
}

export { toggleDisplay, submit, initChat };
