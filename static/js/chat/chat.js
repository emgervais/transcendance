import * as chatUtils from "/js/chat/chatUtils.js";
import * as chatMessages from "/js/chat/messages.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js"

var chatSockets = {
	'global': undefined,
	'match': undefined,
};
var currRoomId = 'global';

function updateRoomId(id) {
	currRoomId = id;
}

function start(roomId="global") {
	console.log("start, room:", roomId);
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
			chatMessages.generateMessage(message, who, sender.image, data.sender_id);
		}
		chatMessages.saveMessage(roomId, message, who, sender.image, data.sender_id);
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
		throw new Error(`chat.submit: unexistant roomId: ${currRoomId}`);
    }
	ws.send(JSON.stringify({
		'message': message
	}));
}

function stop(roomId=undefined) {
	if (roomId) {
		_stop(roomId);
		return;
	}
	for (roomId in chatSockets) {
		_stop(roomId);
	}
}

function _stop(roomId) {
    let ws = chatSockets[roomId];
    if (!ws) {
		throw new Error("chat.stop: no active notifications websocket");
    }
	ws.close();
    delete chatSockets[roomId];
	chatMessages.deleteMessages(roomId);
	if(currRoomId === roomId)
		chatUtils.clearLogs();
}
// --------------------------------

export { submit, start, stop, chatSockets };
export { currRoomId, updateRoomId };
