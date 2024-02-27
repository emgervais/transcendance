import * as user from "/js/user.js"

var chatSocket;
var INDEX;

function initChat() {
	INDEX = 0;
	const chatSubmit = document.getElementById('chat-submit');
	const chatInput = document.getElementById('chat-input');
	loadMessages();
	chatSubmit.addEventListener('click', function(e) {
	  e.preventDefault();
	  var msg = chatInput.value.trim();
	  if (msg === '') {
		return false;
	  }
	  submit(msg);
	});

	var chatCircle = document.getElementById('chat-circle');//add connected check
	chatCircle.addEventListener('click', function() {
	  chatCircle.classList.remove('chat-active');
	  document.querySelector('.chat-box').classList.add('chat-active');;
	});

	var chatBoxToggle = document.querySelector('.chat-box-toggle');
	chatBoxToggle.addEventListener('click', function() {
		chatCircle.classList.add('chat-active');
		document.querySelector('.chat-box').classList.remove('chat-active');
	});
}

async function generateMessage(msg, type, img) {
	const chatInput = document.getElementById('chat-input');
	const chatLogs = document.querySelector('.chat-logs');

	var str = "";
	str += "<div id='cm-msg-" + INDEX + "' class=\"chat-msg " + type + "\">";
	str += "          <span class=\"msg-avatar\">";
	str += "            <img src=\"" + img + "\">";
	str += "          <\/span>";
	str += "          <div class=\"cm-msg-text\">";
	str += msg;
	str += "          <\/div>";
	str += "        <\/div>";
	chatLogs.insertAdjacentHTML('beforeend', str);
	var newMessage = document.getElementById('cm-msg-' + INDEX);
	newMessage.style.display = 'block';
	newMessage.style.animation = 'fadeIn 0.3s ease forwards';
	if (type === 'self') {
	  chatInput.value = '';
	}
	chatLogs.scrollTop = chatLogs.scrollHeight;
}

async function saveMessage(msg, type, img) {
	let messages = JSON.parse(sessionStorage.getItem("messages"));
	console.log('first: ', messages);
	const newMessage = {
		message: msg,
		type: type,
		image: img,
	};
	if(!messages)
		messages = [];

	messages.push(newMessage);
	sessionStorage.setItem("messages", JSON.stringify(messages));
}

function loadMessages() {
	const messages = JSON.parse(sessionStorage.getItem("messages"));
	if(!messages)
		return;
	messages.forEach(msg => {
		generateMessage(msg.message, msg.type, msg.image);
	});
}

function chatMaster() {
	var roomName = 'room';
	chatSocket = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomName + '/'	// Room name according to user's friends
	);

	chatSocket.onmessage = async (event) => {
		const data = JSON.parse(event.data);
		let	who = 'else';
		if(data.sender_id === (await user.getUser()).id)
			who = 'self';
		const username = (await user.getUser(data.sender_id)).username;
		const message = username + ': ' + data.message;
		INDEX++;
		generateMessage(message, who, data.image);
		saveMessage(message, who, data.image);
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

}

function submit(message) {
	chatSocket.send(JSON.stringify({
		'message': message
	}));
}

function closeChat() {
	if (chatSocket) {
		chatSocket.close();
		chatSocket = undefined;
	}
}
// --------------------------------

export { submit, chatMaster, initChat, closeChat };
