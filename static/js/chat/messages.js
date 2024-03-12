import * as chat from "/js/chat/chat.js";

const SELF = "self";
const OTHER = "other";

function loadMessages(roomId) {
	clearLogs();
	var messages = JSON.parse(sessionStorage.getItem("messages"));

	if(!messages)
		return;
	messages = messages.filter(room => room.roomId === roomId)
	messages.forEach(msg => {
		generateMessage(msg.message, msg.isCurrUser, msg.image, msg.userId);
	});
}

async function generateMessage(msg, isCurrUser, img, userId) {
	const chatInput = document.getElementById('chat-input');
	const chatLogs = document.querySelector('.chat-logs');

	var str = "";
	str += `<div class="chat-msg ${isCurrUser ? "self" : "other"}">`;
	str += `          <span class="msg-avatar">`;
	str += `            <img src="${img}" class="profile-picture-chat" data-id="${userId}">`;
	str += `          </span>`;
	str += `          <div class="cm-msg-text">`;
	str += msg;
	str += "          </div>";
	str += "        </div>";
	chatLogs.insertAdjacentHTML('beforeend', str);
	if (isCurrUser) {
	  chatInput.value = '';
	}
	chatLogs.scrollTop = chatLogs.scrollHeight;
}

async function saveMessage(roomId, msg, isCurrUser, img, userId) {
	console.log("saveMessage:", roomId, msg);
	let messages = JSON.parse(sessionStorage.getItem("messages")) || [];
	const newMessage = {
		roomId: roomId,
		message: msg,
		isCurrUser,
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
	sessionStorage.setItem('messages', JSON.stringify(filteredMessages));
	if(chat.currRoomId === roomId) {
		clearLogs();	
	}
}

function clearLogs() {
	document.querySelector('.chat-logs').innerHTML = '';
}

export { SELF, OTHER };
export { loadMessages, generateMessage, saveMessage, deleteMessages };
export { clearLogs };