import * as api from "/js/api.js";
import * as chat from "/js/chat/chat.js";
import { getUser } from "/js/user/user.js"

var connectedFriends = [];

function update(id, connected) {
    if (connected) {
        addConnectedFriend(id);
    } else {
        removeConnectedFriend(id);
    }
}

function addConnectedFriend(id) {
    connectedFriends.push(id);
}

function removeConnectedFriend(id) {
    connectedFriends = connectedFriends.filter(item => item !== id);
}

function set(_connectedFriends) {
	connectedFriends = _connectedFriends;
}

// -- friends list ----
async function generateFriendsList(container) {
	container.innerHTML = '';
	if (connectedFriends.length == 0) {
		container.innerHTML = "<div class='dropdown-item chat-tab-container'><p class='greyed-out chat-friends-list'>No friends.</p></div>"
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
		'chat-tab-container'
	);
	const roomId = chat.getRoomId(userId);
	if (roomId === chat.currRoomId) {
		div.classList.add('tab-active');
	}
	const anchor = document.createElement('a');
	anchor.classList.add('chat-friends-list');
	anchor.setAttribute('data-room-id', roomId);
	anchor.title = username;
	anchor.textContent = username;
	div.appendChild(anchor);
	
	const closeIcon = document.createElement('i');
	closeIcon.classList.add('close-friend-chat', 'fa-solid', 'fa-x');
	closeIcon.setAttribute('data-room-id', roomId);
	closeIcon.title = 'Close Chat';
	div.appendChild(closeIcon);
	
	container.appendChild(div);
}

export { connectedFriends, update, set, generateFriendsList };