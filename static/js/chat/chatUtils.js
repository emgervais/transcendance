import * as chat from "/js/chat/chat.js";
import { getUser } from "/js/user/user.js";
import { getCurrUser } from "/js/user/currUser.js";

var connectedFriends = [];

function getAllFriends() {
	api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendManager
    });
}

function generateFriendsList(container) {
	container.innerHTML = '';
	connectedFriends.forEach(userId => {
		generateFriendsListElement(container, userId);
	});
	// const currUserId = getCurrUser().id;
	// for(let chatSocket in chat.chatSockets) {
	// 	if(chatSocket === 'global' || chatSocket === 'match') {
	// 		continue;
	// 	}
	// 	let userId = getCorrespondentId(currUserId, chatSocket);
	// 	if (!userId) {
	// 		throw new Error(`Invalid friend chatSocket: ${chatSocket}`);
	// 	}
	// 	generateFriendsListElement(container, chatSocket, userId);
	// }
}


async function generateFriendsListElement(container, userId) {
	const username = (await getUser(userId)).username;
	const div = document.createElement('div');
	div.classList.add(
		'dropdown-item',
		'chat-tab-container'
		);
		if (chatSocket === chat.currRoomId) {
			div.classList.add('tab-active');
		}
		
		const anchor = document.createElement('a');
		anchor.classList.add('chat-friends-list');
		// anchor.id = chatSocket;
		anchor.title = username;
		anchor.textContent = username;
		div.appendChild(anchor);
		
		// const closeIcon = document.createElement('i');
		// closeIcon.classList.add('close-friend-chat', 'fa-solid', 'fa-x');
		// closeIcon.title = 'Close Chat';
		// closeIcon.setAttribute('data-roomId', chatSocket);
		// div.appendChild(closeIcon);
		
		container.appendChild(div);
	}
	// function getCorrespondentId(currUserId, chatSocket) {
	// 	const ids = chatSocket.split('_').filter(id => {
	// 		return id != currUserId;
	// 	});
	// 	if (ids.length !== 1) {
	// 		return undefined;
	// 	}
	// 	return ids[0];
	// }
	
	function clearLogs() {
		document.querySelector('.chat-logs').innerHTML = '';
	}
	
export { generateFriendsList, clearLogs};