import * as chat from "/js/chat/chat.js";
import * as nav from "/js/nav.js";
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
		switch (data.type) {
			case "chat":
				chat.start(data.room);
				break;
			case "connection":
				chatFriends.update(data.userId, data.connected);
				break;
			case "onlineFriends":
				chatFriends.set(data.userIds);
				break;
			case "friendRequests":
				nav.updateFriendRequestCount(data.count);
				break;
			case "friendRequest":
				nav.incrFriendRequestCount(1);
				break;
			default:
				console.log("Unknown notification:", data);
				break;
		}
    }

	ws.onclose = (_) => {
		stop();
	};
}

function stop() {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
		console.log("notifications.stop: notifications websocket already closed.");
		return;
	}
	console.log('Notifications websocket closed.');
	ws.close();
}

export { start, stop };