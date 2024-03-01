import * as chatUtils from "/js/chat/chatUtils.js";
import * as chatMessages from "/js/chat/messages.js";
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

// -- sockets ----
var chatSockets = {};
chatSockets[GLOBAL_ROOM_ID] = undefined;
chatSockets[MATCH_ROOM_ID] = undefined;

function start(roomId=GLOBAL_ROOM_ID) {
	if (roomId in chatSockets) {
		throw new Error(`chat.start: chatSocket "${roomId}" already exists.`);
	}
	console.log("start, room:", roomId);
	let ws = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/chat/'
		+ roomId + '/'
	);
    chatSockets[roomId] = ws;

	ws.onmessage = async (event) => {
		const data = JSON.parse(event.data);
		console.log("chat, onmessage, data:", data);
		let	who = 'else';
		const sender = await getUser(data.senderId);
		if(data.senderId === getCurrUser().id)
			who = 'self';
		const username = sender.username;
		const message = username + ': ' + data.message;
		if (roomId === currRoomId) {
			chatMessages.generateMessage(message, who, sender.image, data.senderId);
		}
		chatMessages.saveMessage(roomId, message, who, sender.image, data.senderId);
	};

	ws.onclose = (_) => {
		console.log(`Chat websocket "${roomId}" closed.`);
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
		// throw new Error(`chat.stop: no active chat with roomId ${roomId}`);
    }
	ws.send(JSON.stringify({
		'disconnect': true
	}));
	ws.close();
    delete chatSockets[roomId];
	chatMessages.deleteMessages(roomId);
	if(currRoomId === roomId)
		chatUtils.clearLogs();
}
// --------------------------------

export { GLOBAL_ROOM_ID, MATCH_ROOM_ID, currRoomId, getRoomId, updateRoomId };
export { submit, start, stop, chatSockets };
