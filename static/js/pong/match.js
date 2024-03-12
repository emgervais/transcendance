import * as chat from "/js/chat/chat.js";
import * as chatDisplay from "/js/chat/display.js";
import * as notifications from "/js/notifications.js";
import * as router from "/js/router/router.js";
import * as user from "/js/user/user.js";
import * as util from "/js/util.js";

// -- elements ----
const inviteContainer = document.getElementById("game-invite");
const inviteUserContainer = inviteContainer.querySelector(".user-container");
const inviteButtonsContainer = inviteContainer.querySelector(".invite-buttons");
const inviteNotification = document.getElementById("invite-notification");
const shadow = document.getElementById("shadow");

// --
function invite(target) {
    const userId = target.getAttribute("data-user-id");
    let roomId;
    if (userId) {
        roomId = chat.getRoomId(userId);
    } else {
        roomId = "global";
    }
    console.log("invite:", roomId);
    notifications.startMatch(roomId);
}

async function receiveInvite(data) {
    console.log("You got a match request:", data);
    
    util.display(inviteNotification, true);
    const userElement = await user.displayUser({
        userId: data.userId,
        includeBlockButton: false
    });
    inviteUserContainer.appendChild(userElement);

    inviteButtonsContainer.innerHTML = "";
    
    const acceptButton = document.createElement("button");
    acceptButton.innerText = "Accept";
    acceptButton.classList.add("respond-invite");
    acceptButton.setAttribute("data-room-id", data.room);
    acceptButton.setAttribute("data-cancel", false);    
    inviteButtonsContainer.appendChild(acceptButton);

    const declineButton = document.createElement("button");
    declineButton.innerText = "Decline";
    declineButton.classList.add("respond-invite");
    declineButton.setAttribute("data-room-id", data.room);    
    declineButton.setAttribute("data-cancel", true);
    inviteButtonsContainer.appendChild(declineButton);
}

function displayInvite() {
    util.display(inviteNotification, false);
    util.display(shadow);
    util.display(inviteContainer);
}

function respondInvite(target) {
    const roomId = target.getAttribute("data-room-id");
    const cancel = target.getAttribute("data-cancel") == "true";
    console.log("cancel:", cancel, "!cancel:", !cancel);
    notifications.startMatch(roomId, cancel);
}

function start(data) {
    console.log("match.start, data:", data);
    chat.start(`pong_${data.room}`);
    chatDisplay.openChatBox();
    chatDisplay.activateMatchTab();
    router.route("/pong/");
}

export { invite, receiveInvite, displayInvite, respondInvite, start };