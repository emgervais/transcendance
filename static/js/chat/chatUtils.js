import * as chat from "/js/chat/chat.js"
import * as user from "/js/user.js"

async function generateFriendTab(element) {
	const currUser = user.getCurrUser();
	console.log('curr', currUser);
	for(var key in chat.chatSockets) {
		var activate = '';

		var id = key.split('_').filter(function(key) {
			console.log(key, currUser.id);
			return key != currUser.id;
		});
		console.log('id;', id);
		if(key !== 'global' && key !== 'match') {
			if(key === chat.currRoomId) {
				activate = 'tab-active';
			}
			const username = (await user.getUser(id)).username;
			var str = "<div class=\"dropdown-item chat-tab-container\"> <a class=\"chat-tab-list " + activate + "\" href=\"\" id=\"" + key + "\" title=\"" + username +"\">" + username + "</a>"
			+ "<i title=\"close Chat\"class=\"closeFriendChat fa-solid fa-x\" data-roomId=\"" + key + "\"></i> </div>";
			element.insertAdjacentHTML('beforeend', str);
		}
	}
}

function changeChatTab(roomId) {
	document.querySelector('.tab-active').classList.remove('tab-active');
	document.getElementById('tab-friends').classList.add('tab-active');
	chat.updateCurrRoomId(roomId);
	clearLogs()
	loadMessages();
}

function deleteMessages(roomId) {
	var messages = JSON.parse(sessionStorage.getItem('messages')) || [];
	var filteredMessages = messages.filter(function(message) {
	  return message.roomId !== roomId;
	});
	console.log('2', filteredMessages);
	sessionStorage.setItem('messages', JSON.stringify(filteredMessages));
}

async function generateMessage(msg, type, img) {
	const chatInput = document.getElementById('chat-input');
	const chatLogs = document.querySelector('.chat-logs');

	var str = "";
	str += "<div class=\"chat-msg " + type + "\">";
	str += "          <span class=\"msg-avatar\">";
	str += "            <img src=\"" + img + "\">";
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

async function saveMessage(roomId, msg, type, img) {
	let messages = JSON.parse(sessionStorage.getItem("messages"));

	const newMessage = {
		roomId: roomId,
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
    clearLogs();
	var messages = JSON.parse(sessionStorage.getItem("messages"));

	if(!messages)
		return;
	messages = messages.filter(room => room.roomId === chat.currRoomId)
	messages.forEach(msg => {
		generateMessage(msg.message, msg.type, msg.image);
	});
}

function clearLogs() {
	document.querySelector('.chat-logs').innerHTML = '';
}

export {generateFriendTab, changeChatTab, generateMessage, saveMessage, loadMessages, deleteMessages, clearLogs};