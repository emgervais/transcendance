import * as api from "/js/api.js";
import * as chat from "/js/chat/chat.js";
import * as chatDisplay from "/js/chat/display.js";
import * as chatMessages from "/js/chat/messages.js";
import * as notifications from "/js/notifications.js";
import * as pong from "/js/pong/pong.js";
import * as router from "/js/router/router.js";
import * as user from "/js/user/user.js";
import * as util from "/js/util.js";
import { getCurrUser } from "/js/user/currUser.js";

// -- elements ----
const invitesContainer = document.getElementById("game-invites");
const invitesHeader = document.getElementById("game-invites-header");
let lastOpponents = [];
const inviteNotification = document.getElementById("invite-notification");
const shadow = document.getElementById("shadow");
// -- send invite ----
function invite(target) {
    console.log("invite");
    const userId = target.getAttribute("data-user-id");
    let roomId;
    if (userId) {
        roomId = chat.getRoomId(userId);
    } else {
        roomId = "global";
    }
    notifications.matchMaking(roomId);
}

// -- 
let searchingMatch = false;
let searchingMatchId;
function setSearchingMatch({
    roomId,
    searching=true
}) {
    searchingMatchId = roomId;
    searchingMatch = searching;
    util.displayState();
}

function cancelSearchingMatch() {
    notifications.matchMaking(searchingMatchId, true);
    setSearchingMatch({searching: false});
    // tournamentSummary();
}

// -- receive invite ----
let invites = [];

async function receiveInvite(data) {
    if (invites.includes(data.room)) {
        removeInvite(data.room);
    }
    invites.push(data.room);
    makeInviteHeaderMessage();
    const inviteContainer = await createInviteContainer(data);
    invitesContainer.appendChild(inviteContainer);
    util.displayState('has-invites');
}

function makeInviteHeaderMessage() {
    invitesHeader.innerText = `You have${invites.length < 2 ? " a" : ""} game invite${invites.length > 1 ? "s" : ""}!`;
}

async function createInviteContainer(data) {
    const inviteContainer = document.createElement("div");
    inviteContainer.setAttribute("data-room-id", data.room);
    inviteContainer.classList.add("invite");
    const userElement = await user.displayUser({
        userId: data.userId,
        includeBlockButton: false
    });
    inviteContainer.appendChild(userElement);
    includeInviteButtons(inviteContainer, data.room);
    return inviteContainer;
}

function includeInviteButtons(container, room) {
    const acceptButton = document.createElement("button");
    acceptButton.innerText = "Accept";
    acceptButton.classList.add("respond-invite");
    acceptButton.setAttribute("data-room-id", room);
    acceptButton.setAttribute("data-accept", true);    
    container.appendChild(acceptButton);

    const declineButton = document.createElement("button");
    declineButton.innerText = "Decline";
    declineButton.classList.add("respond-invite");
    declineButton.setAttribute("data-room-id", room);    
    declineButton.setAttribute("data-accept", false);
    container.appendChild(declineButton);
}

function removeInvite(room) {
    const inviteContainers = invitesContainer.querySelectorAll(".invite");
    for (const inviteContainer of inviteContainers) {
        const currRoom = inviteContainer.getAttribute("data-room-id");
        if (currRoom == room) {
            inviteContainer.remove();
            break;
        }
    }
    invites = invites.filter(currRoom => {
        return currRoom !== room;
    });

}

function displayInvite() {
    util.display(shadow);
    util.display(invitesContainer);
}

// -- repond invite ----
function respondInvite(target) {
    const roomId = target.getAttribute("data-room-id");
    const cancel = target.getAttribute("data-accept") == "false";
    removeInvite(roomId);
    if (invites.length == 0) {
        util.display(inviteNotification, false);
    }
    notifications.matchMaking(roomId, cancel);
    util.display(shadow, false);
    util.display(invitesContainer, false);
}

function clearInvites() {
    invites = [];
}

// -- start ----
async function start(data) {
    if (router.getCurrentLocation() != "/")
        await router.route("/");
    chat.stop(chat.matchRoomId);
    chatMessages.deleteMessages(chat.matchRoomId);
    chat.start(`pong_${data.room}`);
    // chatDisplay.openChatBox();
    // chatDisplay.activateMatchTab();
    pong.connect(data.room, data.tournamentId);
    displayOpponentName(data.room);
}

async function displayOpponentName(room) {
    const element = document.getElementById("opponent-username");
    const opponentName = await getOpponentName(room);
    element.innerHTML = opponentName ? `Opponent: ${opponentName}` : "";
    lastOpponents.push(opponentName ? opponentName : "");
    if (lastOpponents.length > 2) {
        lastOpponents.shift();
    }
}

async function getOpponentName(room) {
    let ids = room.split('_');
    for (let i = 0; i < ids.length; i++) {
        let id = ids[i];
        if (id != getCurrUser().id) {
            return (await user.getUser(id)).username;
        }
    }    
}

async function tournamentSummary(data) {
    const element = document.getElementById("tournament-summary");
    for (let key in data) {
        if(key == 'first' || key == 'second') {
            element.querySelectorAll('.' + key).forEach(el => {
                el.innerHTML = data[key];
            });
        }
        if(data[key] == await (getCurrUser()).username)
            var place = key;
        if(data[key] == lastOpponents[0])
            var opponentPlace = key;
    }
    if(place == 'first' || place == 'second') {
        let el = element.querySelector('.' + place + '.top');
        let inner = el.nextElementSibling;
        inner.innerHTML = data[opponentPlace];
        element.querySelector('div.player:empty').innerHTML = opponentPlace == 'third' ? data['fourth'] : data['third'];
    }
    else {
        let el = element.querySelector('.' + opponentPlace + '.top');
        let inner = el.nextElementSibling;
        inner.innerHTML = data[place];
        element.querySelector('div.player:empty').innerHTML = place == 'third' ? data['fourth'] : data['third'];
    }
    element.style.display = 'flex';
}

function clearPongText() {
    const playerElements = document.querySelectorAll(".player");
    if (playerElements) {
        playerElements.forEach(el => {
            el.innerHTML = '';
        });
    }
    const el = document.getElementById("tournament-summary");
    if (el)
        el.style.display = 'none';
}

export { invite, receiveInvite, displayInvite, respondInvite, invites, clearInvites };
export { searchingMatch, setSearchingMatch, cancelSearchingMatch };
export { start, tournamentSummary, clearPongText };