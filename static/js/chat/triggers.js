import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import * as chatMessages from "/js/chat/messages.js";
import * as notifications from "/js/notifications.js";
import * as util from "/js/util.js";
import { GLOBAL_ROOM_ID, MATCH_ROOM_ID } from "/js/chat/chat.js";

const chatIcon = document.getElementById('chat-icon');
const chatBox = document.getElementById('chat-box');

const globalTab = document.getElementById('tab-global');
const gameTab = document.getElementById('tab-game');
const friendsTab = document.getElementById('tab-friends');

const friendsList = document.getElementById('friendlist-tab');
var friendsListShown = false;

const menu = document.getElementById('chat-menu');
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
	util.setClass(chatIcon, 'chat-active', false);
	util.setClass(chatBox, 'chat-active', true);
	chat.clearUnreadMsgCount(chat.currRoomId);
}

function closeChatBox() {
	util.setClass(chatIcon, 'chat-active', true);
	util.setClass(chatBox, 'chat-active', false);
}

// -- tabs ----
function activateGameTab() {
	activateTab(gameTab, MATCH_ROOM_ID);
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
	chatMessages.loadMessages();
	chat.clearUnreadMsgCount(roomId);
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
	updateMenu(target.getAttribute('data-id'));
	// const imageRect = target.getBoundingClientRect();
	// var imageX = imageRect.left + window.scrollX;
	// var imageY = imageRect.top + window.scrollY;

	// menu.style.left = imageX + 'px';
	// menu.style.top = (imageY - menu.offsetHeight) + 'px';
	util.display(menu, true);
};

function disableMenu() {
	util.display(menu, false);
}

function updateMenu(id) {
	var menuOptions = {
		'stats' : '<i class=\"fa-solid fa-chart-simple\"></i>',
		'block' : '<i class=\"fa-solid fa-ban\"></i>',
		'invite' : '<i class=\"fa-solid fa-gamepad\"></i>'
	};
	let i = 0;
	menu.innerHTML = '';
	for(var option in menuOptions) {
		var li = document.createElement('li');
		li.style = '--i:' + i++ + ';'
		var a = document.createElement('a');
		a.href = '#';
		a.setAttribute('id', id);
		a.innerHTML = menuOptions[option];
		li.appendChild(a);
		menu.appendChild(li);
	};
}

export { toggleChatBox, closeChatBox, chatBoxOpened }
export { activateGlobalTab, toggleFriendsList, activateFriendsTab, closeFriendChat, activateGameTab };
export { activateMenu, disableMenu };