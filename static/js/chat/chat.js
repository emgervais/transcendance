import * as chatMessages from "/js/chat/messages.js";
import * as chatDisplay from "/js/chat/display.js";
import * as chatUnreadMessages from "/js/chat/unreadMessages.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js"

// -- roomId ----
const GLOBAL_ROOM_ID = "global";
var currRoomId = GLOBAL_ROOM_ID;
var matchRoomId;

function updateRoomId(id) {
	currRoomId = id;
}

function getRoomId(userId) {
    const currUserId = getCurrUser().id;
	const roomId = [currUserId, userId].sort().join("_");
	return roomId;
}

function isMatchRoomId(roomId) {
	return roomId.startsWith("pong_");
}

// -- sockets ----
var chatSockets = {};

function start(roomId=GLOBAL_ROOM_ID) {
	if (roomId in chatSockets) {
		console.log(`chat.start: chatSocket "${roomId}" already exists.\nIgnoring.`);
		return;
	}
	let ws = new WebSocket(
		`wss://${window.location.host}/ws/chat/${roomId}/`
	);
	if (isMatchRoomId(roomId)) {
		matchRoomId = roomId;
	}
	chatSockets[roomId] = ws;

	ws.onmessage = async (event) => {
		console.log("onmessage roomId:", roomId);
		const data = JSON.parse(event.data);
		const sender = await getUser(data.senderId);
		const isCurrUser = data.senderId === getCurrUser().id;
		let message = data.message;
		if (roomId == GLOBAL_ROOM_ID || isMatchRoomId(roomId)) {
			message = sender.username + ': ' + message;
		}
		if (roomId === currRoomId) {
			chatMessages.generateMessage(message, isCurrUser, sender.image, data.senderId);
		}
		if (!chatDisplay.chatBoxOpened() || roomId != currRoomId) {
			chatUnreadMessages.incr(roomId);
		}
		chatMessages.saveMessage(roomId, message, isCurrUser, sender.image, data.senderId);
	};

	ws.onclose = (_) => {
		console.log(`Chat websocket "${roomId}" closed.`);
		delete chatSockets[roomId];
		if (roomId == currRoomId) {
			chatDisplay.activateGlobalTab();
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
		return;
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

export { GLOBAL_ROOM_ID, currRoomId, getRoomId, updateRoomId, isMatchRoomId, matchRoomId };
export { submit, start, stop, chatSockets };
