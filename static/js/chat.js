import * as util from "/js/util.js";
import { getUser } from "/js/user.js";

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
	}));
	messageInputDom.value = '';
}

// --------------------------------
function initChat() {
	var roomName = 'main';
	chatSocket = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomName + '/'	// Room name according to user's friends
	);

	chatSocket.onmessage = (event) => {
		const data = JSON.parse(event.data);
		if (data.room_name) {
			console.log('Room name: ' + data.room_name);
		}
		document.getElementById('chat-log').value += (data.message + '\n');
	};

	chatSocket.onclose = (_) => {
		console.error('Chat socket closed unexpectedly');
	};

	document.getElementById('chat-message-input').focus();
}

function initChatUser() {
	var user_ids = [getUser().id, 2].sort();
	var roomName = user_ids.join('_');
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

	// send first message
	chatSocket.onopen = (event) => {
		console.log('Chat socket opened');
		chatSocket.send(JSON.stringify({
			'message': 'Hello, world!',
		}));
	};

	document.getElementById('chat-message-input').focus();
}

export { toggleDisplay, submit, initChat, initChatUser };
