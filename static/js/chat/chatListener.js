import * as chat from "/js/chat/chat.js"
import * as chatUtils from "/js/chat/chatUtils.js"

export function chatListeners() {

    const chatSubmit = document.getElementById('chat-submit');
	const chatInput = document.getElementById('chat-input');
	chatSubmit.addEventListener('click', function(e) {
	  e.preventDefault();
	  var msg = chatInput.value.trim();
	  if (msg === '') {
		return false;
	  }
	  chat.submit(msg);
	});

    var chatCircle = document.getElementById('chat-circle');//add connected check
	chatCircle.addEventListener('click', function() {
	  chatCircle.classList.remove('chat-active');
	  document.querySelector('.chat-box').classList.add('chat-active');;
	});

	var chatBoxToggle = document.querySelector('.chat-box-toggle');
	chatBoxToggle.addEventListener('click', function() {
		chatCircle.classList.add('chat-active');
		document.querySelector('.chat-box').classList.remove('chat-active');
	});

		// -------tabs-----
	var global = document.getElementById('tab-global');
	global.addEventListener('click', function() {
		document.querySelector('.tab-active').classList.remove('tab-active');
		global.classList.add('tab-active');
        chat.updateCurrRoomId('global');
		chatUtils.loadMessages();
	});

	var friends = document.getElementById('tab-friends');
	friends.addEventListener('click', function() {
		const list = document.getElementById('friendlist-tab');
		list.innerHTML = '';
		chatUtils.generateFriendTab(list);
		if(list.classList.contains('show'))
			list.classList.remove('show');
		else
			list.classList.add('show');
	});
	
	var game = document.getElementById('tab-game');
	game.addEventListener('click', function() {
		document.querySelector('.tab-active').classList.remove('tab-active');
		game.classList.add('tab-active');
		chat.updateCurrRoomId('match');
		chatUtils.loadMessages();
	});
}