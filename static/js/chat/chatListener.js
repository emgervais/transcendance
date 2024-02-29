import * as chat from "/js/chat/chat.js";
import * as chatUtils from "/js/chat/chatUtils.js";

export function chatListeners() {


    var chatCircle = document.getElementById('chat-circle');//add connected check
	chatCircle.addEventListener('click', function() {
	  chatCircle.classList.remove('chat-active');
	  document.querySelector('.chat-box').classList.add('chat-active');;
	});

	// var chatBoxToggle = document.querySelector('.chat-box-toggle');
	// chatBoxToggle.addEventListener('click', function() {
	// 	chatCircle.classList.add('chat-active');
	// 	document.querySelector('.chat-box').classList.remove('chat-active');
	// });

	// 	// -------tabs-----
	// var global = document.getElementById('tab-global');
	// global.addEventListener('click', function() {
	// 	document.querySelector('.tab-active').classList.remove('tab-active');
	// 	global.classList.add('tab-active');
    //     chat.updateCurrRoomId('global');
	// 	chatUtils.loadMessages();
	// });

	// var friends = document.getElementById('tab-friends');
	// friends.addEventListener('click', function() {
	// 	const list = document.getElementById('friendlist-tab');
	// 	list.innerHTML = '';
	// 	chatUtils.generateFriendTab(list);
	// 	if(list.classList.contains('show'))
	// 		list.classList.remove('show');
	// 	else
	// 		list.classList.add('show');
	// });
	
	// var game = document.getElementById('tab-game');
	// game.addEventListener('click', function() {
	// 	document.querySelector('.tab-active').classList.remove('tab-active');
	// 	game.classList.add('tab-active');
	// 	chat.updateCurrRoomId('match');
	// 	chatUtils.loadMessages();
	// });
	var menu = document.querySelector('.chatMenu');
	const chatbody = document.querySelector('.chat-box-body');
	chatbody.addEventListener('click', function(event) {
		if (event.target.classList.contains('profile-picture-chat')) {
			updateMenu(event.target.getAttribute('data-id'));
			const imageRect = event.target.getBoundingClientRect();
			var imageX = imageRect.left + window.scrollX;
			var imageY = imageRect.top + window.scrollY;

			menu.style.left = imageX + 'px';
			menu.style.top = (imageY - menu.offsetHeight) + 'px';
			menu.style.display = 'block';
		}
	});

	document.addEventListener('click', function(event) {
        if (!chatbody.contains(event.target)) {
            menu.style.display = 'none';
        }
    });
}

function updateMenu(id) {
	var menuOptions = ['stats', 'block', 'invite'];
	var menu = document.querySelector('.chatMenu');
	menu.innerHTML = '';
	var ul = document.createElement('ul');
	menuOptions.forEach(function(option) {
		var li = document.createElement('li');
		var a = document.createElement('a');
		a.href = '#';
		a.setAttribute('id', id);
		a.textContent = option;
		li.appendChild(a);
		ul.appendChild(li);
	});
	menu.appendChild(ul);
}