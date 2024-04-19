import * as chat from "/js/chat/chat.js";
import * as chatUnreadMessages from "/js/chat/unreadMessages.js";
import * as util from "/js/util.js";
import { getUser } from "/js/user/user.js"

let connectedFriends = [];
let firstSetCall = true;

function set(_connectedFriends) {
	if (!firstSetCall) {
		connectedFriends.forEach(async id => {
			if (!_connectedFriends.includes(id)) {
				let text = `${(await getUser(id)).username} disconnected.`;
				util.showAlert({
					text: text,
				});
			}
		});
		_connectedFriends.forEach(async id => {
			if (!connectedFriends.includes(id)) {
				let text = `${(await getUser(id)).username} connected.`;
				util.showAlert({
					text: text,
				});
			}
		});
	}
	firstSetCall = false;
	connectedFriends = _connectedFriends;
}

// -- friends list ----
async function generateFriendsList(container) {
	container.innerHTML = '';
	if (connectedFriends.length == 0) {
		container.innerHTML = "<div class='dropdown-item chat-tab-container'><p class='greyed-out activate-friend-chat'>No friends.</p></div>"
		return;
	}
	connectedFriends.forEach(userId => {
		generateFriendsListElement(container, userId);
	});
}

async function generateFriendsListElement(container, userId) {
	const username = (await getUser(userId)).username;
	const div = document.createElement('div');
	div.classList.add(
		'dropdown-item',
		'chat-tab-container',
		'activate-friend-chat'
	);
	
	const roomId = chat.getRoomId(userId);
	if (roomId === chat.currRoomId) {
		div.classList.add('tab-active');
	}

	div.setAttribute('data-room-id', roomId);
	const anchor = document.createElement('a');
	anchor.title = username;
	anchor.textContent = username;
	div.appendChild(anchor);

	if (chatUnreadMessages.roomCounts[roomId]) {
		const bell = chatUnreadMessages.makeBell();
		div.appendChild(bell);
	}

	const closeIcon = document.createElement('i');
	closeIcon.classList.add('close-friend-chat', 'fa-solid', 'fa-x');
	closeIcon.setAttribute('data-room-id', roomId);
	closeIcon.title = 'Close Chat';
	div.appendChild(closeIcon);
	
	container.appendChild(div);
}

export { connectedFriends, set, generateFriendsList };