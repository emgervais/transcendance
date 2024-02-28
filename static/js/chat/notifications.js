import { getCurrUser } from "/js/user.js"
import * as chat from "/js/chat/chat.js";
var ws;

async function notificationMaster() {
	var userId = getCurrUser().id;
	ws = new WebSocket(
		'wss://'
		+ window.location.host
		+ '/ws/notifications/'
		+ userId + '/'
	);

	ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("ws.onmessage:", data);
        if (data.notification === "chat") {
            chat.startChat(data.room);
        }
    }

	ws.onclose = (_) => {
		console.error('Notifications socket closed unexpectedly');
	};
}

export { notificationMaster };