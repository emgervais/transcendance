import * as user from "/js/user.js"
import * as test from "/js/test_messages.js"
import * as chatUtils from "/js/chat/chatUtils.js"
import * as chatListener from "/js/chat/chatListener.js"

var chatSockets = {
	'global': 1,
	'match': 2,
};
var currRoomId = 'global';

function updateCurrRoomId(newRoom) {
    currRoomId = newRoom;
}

function initChat() {
	test.setMessages();
	chatListener.chatListeners();
	chatUtils.loadMessages();
}

function startChat(roomId="global") {
	console.log("startChat, room:", roomId);
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
		const sender = await user.getUser(data.sender_id);
		if(data.sender_id === user.getCurrUser().id)
			who = 'self';
		const username = sender.username;
		const message = username + ': ' + data.message;
		if (roomId === currRoomId) {
			chatUtils.generateMessage(message, who, sender.image);
		}
		chatUtils.saveMessage(roomId, message, who, sender.image);
	};

	ws.onclose = (_) => {
		console.error('Chat socket closed unexpectedly');
	};

}

function submit(message) {
    let ws = chatSockets[currRoomId];
    if (!ws) {
        console.log("chat: submit: unexistant roomId");
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
