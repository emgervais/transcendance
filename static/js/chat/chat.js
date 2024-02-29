import * as chatUtils from "/js/chat/chatUtils.js";
import * as chatTriggers from "/js/chat/triggers.js";
import * as test from "/js/test_messages.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js"

var chatSockets = {
	'global': undefined,
	'match': undefined,
};
var currRoomId = 'global';

function updateCurrRoomId(newRoom) {
    currRoomId = newRoom;
}

function initChat() {
	test.setMessages();
	chatUtils.loadMessages();
}

function startChat(roomId="global") {
	console.log("startChat, room:", roomId);
	let ws = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomId + '/'	// Room name according to user's friends
	);
    chatSockets[roomId] = ws;

	ws.onmessage = async (event) => {
		const data = JSON.parse(event.data);
		let	who = 'else';
		const sender = await getUser(data.sender_id);
		if(data.sender_id === getCurrUser().id)
			who = 'self';
		const username = sender.username;
		const message = username + ': ' + data.message;
		if (roomId === currRoomId) {
			chatUtils.generateMessage(message, who, sender.image, data.sender_id);
		}
		chatUtils.saveMessage(roomId, message, who, sender.image, data.sender_id);
	};

	ws.onclose = (_) => {
		console.error('Chat socket closed unexpectedly');
	};

}

const chatInput = document.getElementById('chat-input');
function submit() {
	let message = chatInput.value.trim();
	if (!message) {
		return;
	}
    let ws = chatSockets[currRoomId];
    if (!ws) {
        console.log("chat: submit: unexistant roomId:", currRoomId);
        return;
    }
	ws.send(JSON.stringify({
		'message': message
	}));
}

function closeChat(roomId="global") {
    let ws = chatSockets[roomId];
    if (!ws) {
        console.log("chat: closeChat: unexistant roomId");
        return;
    }    
    delete chatSockets[roomId];
	chatUtils.deleteMessages(roomId);
	if(currRoomId === roomId)
		chatUtils.clearLogs();
}
// --------------------------------

export { submit, startChat, initChat, closeChat, chatSockets, updateCurrRoomId, currRoomId};
