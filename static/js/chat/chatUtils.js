import * as chat from "/js/chat/chat.js";
import { getUser } from "/js/user/user.js";
import { getCurrUser } from "/js/user/currUser.js";

function generateFriendsList(container) {
	container.innerHTML = '';
	const currUserId = getCurrUser().id;
	for(let chatSocket in chat.chatSockets) {
		if(chatSocket === 'global' || chatSocket === 'match') {
			continue;
		}
		let userId = getCorrespondentId(currUserId, chatSocket);
		if (!userId) {
			throw new Error(`Invalid friend chatSocket: ${chatSocket}`);
		}
		generateFriendsListElement(container, chatSocket, userId);
	}
}

function getCorrespondentId(currUserId, chatSocket) {
	const ids = chatSocket.split('_').filter(id => {
		return id != currUserId;
	});
	if (ids.length !== 1) {
		return undefined;
	}
	return ids[0];
}

async function generateFriendsListElement(container, chatSocket, userId) {
	const username = (await getUser(userId)).username;
	const div = document.createElement('div');
	div.classList.add(
		'dropdown-item',
		'chat-tab-container'
	);
	if (chatSocket === chat.currRoomId) {
		div.classList.add('tab-active');
	}
	
	const anchor = document.createElement('a');
	anchor.classList.add('chat-tab-list');
	anchor.id = chatSocket;
	anchor.title = username;
	anchor.textContent = username;
	div.appendChild(anchor);
		
	const closeIcon = document.createElement('i');
	closeIcon.classList.add('close-friend-chat', 'fa-solid', 'fa-x');
	closeIcon.title = 'Close Chat';
	closeIcon.setAttribute('data-roomId', chatSocket);
	div.appendChild(closeIcon);

	container.appendChild(div);
}


function deleteMessages(roomId) {
	var messages = JSON.parse(sessionStorage.getItem('messages')) || [];
	var filteredMessages = messages.filter(function(message) {
	  return message.roomId !== roomId;
	});
	console.log('2', filteredMessages);
	sessionStorage.setItem('messages', JSON.stringify(filteredMessages));
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
	let messages = JSON.parse(sessionStorage.getItem("messages"));

	const newMessage = {
		roomId: roomId,
		message: msg,
		type: type,
		image: img,
		userId: userId,
	};
	if(!messages)
		messages = [];

	messages.push(newMessage);
	sessionStorage.setItem("messages", JSON.stringify(messages));
}

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

function clearLogs() {
	document.querySelector('.chat-logs').innerHTML = '';
}

export {generateFriendsList, generateMessage, saveMessage, loadMessages, deleteMessages, clearLogs};