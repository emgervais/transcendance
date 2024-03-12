import * as chatDisplay from "/js/chat/display.js";
import * as util from "/js/util.js";
import { GLOBAL_ROOM_ID, matchRoomId } from "/js/chat/chat.js";

var roomCounts = {};

function incr(roomId, incr=1) {
	if (!(roomId in roomCounts)) {
		roomCounts[roomId] = 0;
	}
	roomCounts[roomId] += incr;
	display();
    console.log("incr: roomId:", roomId, "\nmatchRoomId:", matchRoomId);
	updateTab(roomId, true);
}

function clear(roomId) {
	if (!roomCounts[roomId]) {
		return;
	}
	roomCounts[roomId] = 0;
	display();
	updateTab(roomId, false);
}

function display() {
	const sum = Object.values(roomCounts)
		.reduce((acc, val) => acc + val, 0);
	const unreadMsgCountElements = document.querySelectorAll(".chat-unread-msg-count");
	const text = sum ? `${sum}` : "";
	unreadMsgCountElements.forEach(element => {
		element.innerHTML = text;
	});
}

function friendMsgsLeft() {
	for (const roomId in roomCounts) {
		if (roomId == GLOBAL_ROOM_ID || roomId == matchRoomId) {
			continue;
		}
		if (roomCounts[roomId]) {
			return true;
		}
	}
	return false;
}

function updateTab(roomId, unreadMessages) {
	let tab;

	if (roomId == GLOBAL_ROOM_ID) {
		tab = chatDisplay.globalTab;
	} else if (roomId == matchRoomId) {
		tab = chatDisplay.matchTab;
	} else {
		tab = chatDisplay.friendsTab;
		if (!unreadMessages) {
			unreadMessages = friendMsgsLeft();
		}
	}
	displayBell(tab, unreadMessages);
}

function displayBell(element, display=true) {
	const icon = element.getElementsByTagName("i")[0];
	util.display(icon, display);
}

function makeBell() {
	const icon = document.createElement("i");
	icon.classList.add("fa-solid", "fa-bell");
	return icon;
}

export { incr, roomCounts, clear, makeBell };
