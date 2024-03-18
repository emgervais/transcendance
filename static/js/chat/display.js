import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import * as chatMessages from "/js/chat/messages.js";
import * as chatUnreadMessages from "/js/chat/unreadMessages.js";
import * as currUser from "/js/user/currUser.js";
import * as util from "/js/util.js";
import { GLOBAL_ROOM_ID, matchRoomId } from "/js/chat/chat.js";

const chatIcon = document.getElementById('chat-icon');
const chatBox = document.getElementById('chat-box');

const globalTab = document.getElementById('tab-global');
const friendsTab = document.getElementById('tab-friends');
const matchTab = document.getElementById('tab-game');

const friendsList = document.getElementById('friendlist-tab');
var friendsListShown = false;

var currMenu = 0;
const menu = document.getElementById('chat-menu');
const logs = document.querySelector('.chat-logs');
logs.addEventListener('scroll', function() {
	disableMenu();
  });
const chatbody = document.querySelector('.chat-box-body');


// -- chatBox ----
function toggleChatBox() {
	if (!chatBoxOpened()) {
		openChatBox();
	} else {
		closeChatBox();
	}
}

function chatBoxOpened() {
	return chatBox.classList.contains('chat-active');
}

function openChatBox() {
	chatMessages.loadMessages(chat.currRoomId);
	util.setClass(chatIcon, 'chat-active', false);
	util.setClass(chatBox, 'chat-active', true);
	chatUnreadMessages.clear(chat.currRoomId);
}

function closeChatBox() {
	util.setClass(chatIcon, 'chat-active', true);
	util.setClass(chatBox, 'chat-active', false);
}

// -- tabs ----
function activateMatchTab() {
	activateTab(matchTab, matchRoomId);
};

function activateGlobalTab() {
	activateTab(globalTab, GLOBAL_ROOM_ID);
}

function activateFriendsTab(target) {
	const roomId = target.getAttribute('data-room-id');
	if (!roomId) {
		return;
	}
	if (!(roomId in chat.chatSockets)) {
		chat.start(roomId);
	}
	activateTab(friendsTab, roomId);
}

function closeFriendChat(target) {
	const roomId = target.getAttribute('data-room-id');
	chat.stop(roomId);
	activateGlobalTab();
}

function activateTab(target, roomId) {
	closeFriendsList();
	if (chat.currRoomId == roomId) {
		return;
	}
	chat.updateRoomId(roomId);
	document.querySelector('.tab-active').classList.remove('tab-active');
	target.classList.add('tab-active');
	chatMessages.loadMessages(roomId);
	chatUnreadMessages.clear(roomId);
}

// -- friendsList ----
function toggleFriendsList() {
	if (friendsListShown) {
		closeFriendsList();
	} else {
		activateFriendsList();
	}
};

function activateFriendsList() {
	chatFriends.generateFriendsList(friendsList);
	util.setClass(friendsList, 'show', true);
	friendsListShown = true;
};

function closeFriendsList() {
	util.setClass(friendsList, 'show', false);
	friendsListShown = false;
}

// -- avatar ----
function activateMenu(target) {
	const userId = target.getAttribute('data-id');
	if (userId == currUser.getCurrUser().id) {
		return;
	}
	if(currMenu == target) {
		menu.classList.toggle('active');
		currMenu = 0;
		return;
	}
	updateMenu(userId);
	const imageRect = target.getBoundingClientRect();
	menu.style.left = imageRect.left - 50 + 'px';
	menu.style.top = imageRect.top - 50 + 'px';
	if(!currMenu)
		menu.classList.toggle('active');
	currMenu = target;
};

function disableMenu() {
	menu.classList.remove('active');
	currMenu = 0;
}

//<button class="make-friend-request-button" data-user-id="3">Send request</button>
function updateMenu(id) {
	var menuOptions = {
		'stats' : `<a href="/account/stats/${id}/"> <i class="fa-solid fa-chart-simple"></i></a>`,
		'block' : `<button class="block-user-button" data-block="true" data-user-id="${id}"> <i class="fa-solid fa-ban"></i></button>`,
		'invite' : `<button class="start-match" data-user-id="${id}"> <i class="fa-solid fa-gamepad"></i></button>`,
		'add': `<button class="make-friend-request-button" data-user-id="${id}"><i class="fa-solid fa-plus"></i></button>`,
	};
	let i = 0;
	menu.innerHTML = '';
	for(var option in menuOptions) {
		var li = document.createElement('li');
		li.style = '--i:' + i++ + ';'
		li.title = option;
		li.innerHTML = menuOptions[option];
		menu.appendChild(li);
	};
}

export { chatIcon, globalTab, friendsTab, matchTab };
export { toggleChatBox, openChatBox, closeChatBox, chatBoxOpened }
export { activateGlobalTab, toggleFriendsList, activateFriendsTab, closeFriendChat, activateMatchTab };
export { activateMenu, disableMenu };