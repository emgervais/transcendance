import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import * as friends from "/js/account/friends.js";
import * as match from "/js/pong/match.js";
import * as nav from "/js/nav.js";
import * as pong from "/js/pong/pong.js";
import * as util from "/js/util.js";
import { getCurrUser } from "/js/user/currUser.js";
import { setUserStatus, getUser, alertStatus } from "/js/user/user.js";

var ws;

async function start() {
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
				const prevStatus = (await getUser(data.userId)).status;
				const connected = (data.status == 'online') && (prevStatus != 'in-game');
				const disconnected = data.status == "offline";
				chatFriends.update(data.userId, connected, disconnected);
				friends.incrOnlineFriendsCount(connected, disconnected);
				setUserStatus(data.userId, data.status);
				alertStatus(data.userId, prevStatus, data.status);
				break;
			case "unfriend":
				friends.refresh();
				break;
			case "onlineFriends":
				chatFriends.set(data.userIds);
				friends.setOnlineFriendsCount(data.userIds.length);
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
		// console.log("Notifications socket closed.");
	};
}

function pongNotifications(data) {
	switch (data.description) {
		case "searchingMatch":
			match.setSearchingMatch({roomId: data.room});
			break;
		case "matchRequest":
			match.receiveInvite(data);
			break;
		case "matchRefused":
			match.setSearchingMatch({searching: false});
			util.showAlert({text: "Opponent refused to play."});
			break;
		case "opponentIngame":
			util.showAlert({text: "Opponent is already in game."});
			break;
		case "opponentOffline":
			util.showAlert({text: "Opponent is offline."});
			break;
		case "matchFound":
			match.setSearchingMatch({searching: false});
			match.start(data);
			break;
		case "tournamentSummary":
			match.tournamentSummary(data.positions);
			break;
		case "gameStopped":
			util.showAlert({ text: "Game stopped.", timeout: null, closeButton: true });
			if (pong.notInGame)
				break;
			pong.disconnect();
			break;
		case "tournamentStopped":
			util.showAlert({ text: "Tournament stopped.", timeout: null, closeButton: true });
			if (pong.notInGame)
				break;
			pong.disconnect();
			break;
		default:
			console.log("Unknown notification:", data);
			break;			
	}

}

function stop() {
    if (!ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
		console.log("notifications.stop: notifications websocket already closed.");
		return;
	}
	ws.close();
}

function matchMaking(roomId, cancel=false) {
	if (!ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)  {
		return;
	}
	ws.send(JSON.stringify({
		type: "matchmaking",
		room: roomId,
		cancel: cancel,
	}));
}

async function nextGame(tournamentId) {
	if (!tournamentId || !ws || ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)  {
		return;
	}
	await util.sleep(2000);
	ws.send(JSON.stringify({
		type: "nextGame",
		tournamentId: tournamentId,
	}));	
}

export { start, stop, matchMaking, nextGame };