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
		switch (data.type) {
			case "chat":
				chat.start(data.room);
				break;
			case "connection":
				// TODO
				chatFriends.update(data.id, data.connected);
				break;
		}
    }

	ws.onclose = () => {
		console.log("Notifications closed");
	}
}

function stop() {
    if (!ws) {
		throw new Error("notifications.stop: no active notifications websocket");
	}
	ws.close();
	ws = undefined;
}

export { start, stop };