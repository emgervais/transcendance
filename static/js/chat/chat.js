import * as chatMessages from "/js/chat/messages.js";
import * as chatTriggers from "/js/chat/triggers.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js"

// -- roomId ----
const GLOBAL_ROOM_ID = "global";
const MATCH_ROOM_ID = "match";

var currRoomId = GLOBAL_ROOM_ID;

function updateRoomId(id) {
	currRoomId = id;
}

function getRoomId(userId) {
    const currUserId = getCurrUser().id;
	const roomId = [currUserId, userId].sort().join("_");
	return roomId;
}

function isFriendRoom(roomId) {
	return roomId != GLOBAL_ROOM_ID && roomId != MATCH_ROOM_ID;
}

// -- sockets ----
var chatSockets = {};

function start(roomId=GLOBAL_ROOM_ID) {
	if (roomId in chatSockets) {
		throw new Error(`chat.start: chatSocket "${roomId}" already exists.`);
	}
	let ws = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomId + '/'
	);
    chatSockets[roomId] = ws;

	ws.onmessage = async (event) => {
		const data = JSON.parse(event.data);
		let	who = 'else';
		const sender = await getUser(data.senderId);
		if(data.senderId === getCurrUser().id)
			who = 'self';
		let message = data.message;
		if (!isFriendRoom(roomId)) {
			const username = sender.username;
			message = username + ': ' + message;
		}
		if (roomId === currRoomId) {
			chatMessages.generateMessage(message, who, sender.image, data.senderId);
		}
		chatMessages.saveMessage(roomId, message, who, sender.image, data.senderId);
	};

	ws.onclose = (_) => {
		console.log(`Chat websocket "${roomId}" closed.`);
		delete chatSockets[roomId];
		if (roomId == currRoomId) {
			chatTriggers.activateGlobalTab();
		}
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

function stop(roomId) {
    let ws = chatSockets[roomId];
    if (!ws) {
		console.log(`chat.stop: no active chat with roomId "${roomId}"`);
		return;
    }
	ws.send(JSON.stringify({
		'closing': true
	}));
	console.log(`Closing chat webSocket: ${roomId}`);
	chatMessages.deleteMessages(roomId);
	if (ws.readyState !== WebSocket.CLOSED) {
		ws.close();
	}
    delete chatSockets[roomId];
}
// --------------------------------

export { GLOBAL_ROOM_ID, MATCH_ROOM_ID, currRoomId, getRoomId, updateRoomId, isFriendRoom };
export { submit, start, stop, chatSockets };
