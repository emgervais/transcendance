import * as chat from "/js/chat/chat.js";

function loadMessages() {
    clearLogs();
	var messages = JSON.parse(sessionStorage.getItem("messages"));

	if(!messages)
		return;
	messages = messages.filter(room => room.roomId === chat.currRoomId)
	messages.forEach(msg => {
		generateMessage(msg.message, msg.type, msg.image, msg.userId);
	});
}

async function generateMessage(msg, type, img, userId) {
	const chatInput = document.getElementById('chat-input');
	const chatLogs = document.querySelector('.chat-logs');

	var str = "";
	str += "<div class=\"chat-msg " + type + "\">";
	str += "          <span class=\"msg-avatar\">";
	str += "            <img src=\"" + img + "\" class=\"profile-picture-chat\" data-id=\"" + userId + "\">";
	str += "          <\/span>";
	str += "          <div class=\"cm-msg-text\">";
	str += msg;
	str += "          <\/div>";
	str += "        <\/div>";
	chatLogs.insertAdjacentHTML('beforeend', str);
	if (type === 'self') {
	  chatInput.value = '';
	}
	chatLogs.scrollTop = chatLogs.scrollHeight;
}

async function saveMessage(roomId, msg, type, img, userId) {
	let messages = JSON.parse(sessionStorage.getItem("messages")) || [];
	const newMessage = {
		roomId: roomId,
		message: msg,
		type: type,
		image: img,
		userId: userId,
	};
	messages.push(newMessage);
	sessionStorage.setItem("messages", JSON.stringify(messages));
}

async function deleteMessages(roomId) {
	var messages = JSON.parse(sessionStorage.getItem('messages')) || [];
	var filteredMessages = messages.filter(function(message) {
	  return message.roomId !== roomId;
	});
	console.log('2', filteredMessages);
	sessionStorage.setItem('messages', JSON.stringify(filteredMessages));
	if(chat.currRoomId === roomId) {
		clearLogs();	
	}
}

function clearLogs() {
	document.querySelector('.chat-logs').innerHTML = '';
}


export { loadMessages, generateMessage, saveMessage, deleteMessages };
export { clearLogs };