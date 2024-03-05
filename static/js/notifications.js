import * as chat from "/js/chat/chat.js";
import * as nav from "/js/nav.js";
import * as chatFriends from "/js/chat/friends.js";
import * as util from "/js/util.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";

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
				util.showAlert({
					text: `${(await getUser(data.userId)).username} just ${data.connected ? "": "dis"}connected.`,
					timeout: 2,
				});
				console.log("done with connection");
				break;
			case "onlineFriends":
				chatFriends.set(data.userIds);
				break;
			case "friendRequests":
				nav.updateFriendRequestCount(data.count);
				break;
			case "friendRequest":
				util.showAlert({
					text: `${(await getUser(data.userId)).username} sent you a friend request.`,
					timeout: 2,
				});				
				nav.incrFriendRequestCount();
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