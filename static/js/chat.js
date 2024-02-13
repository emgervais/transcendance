var chatShown = false;

export function toggleDisplay() {
	const functions = {
		true: hide,
		false: display
	}
	functions[chatShown]();
	chatShown = !chatShown;
}

function display() {
	console.log("display");
	const chat = document.querySelector("#chat-widget");
	chat.style.display = "block";
}

function hide() {
	const chat = document.querySelector("#chat-widget");
	chat.style.display = "none";
}

export function submitButton() {
	const messageInputDom = document.querySelector('#chat-message-input');
	const message = messageInputDom.value;
	chatSocket.send(JSON.stringify({
		'message': message
	}));
	messageInputDom.value = '';
}

// --------------------------------
var roomName = 'room';
const chatSocket = new WebSocket(
	'wss://'
	+ window.location.host
	+ '/ws/chat/'
	+ roomName + '/'	// Room name according to user's friends
);

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
		document.querySelector('#chat-submit-button').click();
	}
};
