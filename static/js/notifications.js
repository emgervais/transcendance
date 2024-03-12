import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import * as friends from "/js/account/friends.js";
import * as match from "/js/pong/match.js";
import * as nav from "/js/nav.js";
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
		console.log("notifications:", data);
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
				break;
			case "onlineFriends":
				chatFriends.set(data.userIds);
				break;
			case "friendRequests":
				nav.updateFriendRequestCount(data.count);
				break;
			case "friendRequest":
				friends.receiveFriendRequest(data);
				break;
			case "pong":
				pongNotifications(data);
				break;
			default:
				console.log("Unknown notification:", data);
				break;
		}
    }

	ws.onclose = (_) => {
		console.log("Notifications socket closed.");
		stop();
	};
}

function pongNotifications(data) {
	switch (data.description) {
		case "searchingMatch":
			break;
		case "matchRequest":
			match.receiveInvite(data);
			break;
		case "matchRefused":
			break;
		case "opponentIngame":
			break;
		case "opponentOffline":
			break;
		case "matchFound":
			match.start(data);
			break;
		default:
			console.log("Unknown notification:", data);
			break;			
	}

}

function stop() {
    if (!ws || ws.readyState === WebSocket.CLOSED) {
		console.log("notifications.stop: notifications websocket already closed.");
		return;
	}
	console.log('Notifications websocket closed.');
	ws.close();
}

function startMatch(roomId, cancel=false) {
	if (!ws) {
		throw new Error("notifications.startMatch: notifications websocket not started");
	}
	console.log();
	ws.send(JSON.stringify({
		type: "matchmaking",
		room: roomId,
		cancel: cancel,
	}));
}

export { start, stop, startMatch };