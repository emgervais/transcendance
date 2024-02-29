import * as chat from "/js/chat/chat.js";
import { getCurrUser } from "/js/user/currUser.js";

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

	ws.onclose = () => {
		console.log("Notifications closed");
	}
}

export { notificationMaster };