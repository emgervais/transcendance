import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import { getCurrUser } from "/js/user/currUser.js";

var ws;

function start() {
	var userId = getCurrUser().id;
	ws = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/notifications/'
		+ userId + '/'
	);

	ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("ws.onmessage:", data);
		switch (data.notification) { // TODO: data.type
			case "chat":
				chat.start(data.room);
				break;
			case "connection":
				// TODO
				chatFriends.update(data.userId, data.connected);
				break;
		}
    }

	ws.onclose = (_) => {
		console.log('Notifications websocket closed.');
	};
}

function stop() {
    if (!ws) {
		console.log("notifications.stop: no active notifications websocket");
		return;
	}
	ws.close();
	ws = undefined;
}

export { start, stop };