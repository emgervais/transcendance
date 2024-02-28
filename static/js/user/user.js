import * as api from "/js/api.js";
import * as chat from "/js/chat/chat.js";
import { getCurrUser } from "/js/user/currUser.js";
import * as util from "/js/util.js";

var users = {};

// -- singletons ----
async function getUser(id) {
    let key = "user-" + id;
    if (key in users) {
        return users[key];
    }
    await api.fetchRoute({
        route: `/api/user/${id}/`,
        dataManager: user => {
            setUser(id, user);
        },
    });
    return users[key];
}

function setUser(id, user) {
    let key = "user-" + id;
    users[key] = {
        username: user.username,
        image: user.image,
        status: user.status,
    };
}

function removeUser(id) {
    let key = "user-" + id;
    delete users[key];
}

// -- display ----
async function displayUser(container, userId, blocked=false) {
    const div = document.createElement("div");
    const appendToContainer = (currUserId, user) => {
        div.className = "user";
        const img = document.createElement("img");
        img.src = user.image;
        img.className = "img-fluid rounded-circle small-image";
        div.appendChild(img);
        const username = document.createElement("p");
        username.textContent = user.username;
        div.appendChild(username);
        const status = document.createElement("p");
        status.textContent = user.status;
        div.append(status);
        container.appendChild(div);
        addBlockButton(container, userId, !blocked);
        addChatButton(container, currUserId, userId);
        addStartGameButton(container, currUserId, userId);
    };
    const currUserId = getCurrUser().id;
    let user = await getUser(userId);
    appendToContainer(currUserId, user);
    return div;
}

// -- buttons ----
function addBlockButton(container, userId, block) {
    const params = {
        id: container.id + "-block-user-" + userId,
        container: container,
        text: "Block",
        action: blockAction(userId, block),
    };
    if (!block) {
        params.text = "Unblock";
    }
    util.createButton(params);
}

function addChatButton(container, currUserId, targetId) {
    const params = {
        id: container.id + "-chat-user-" + targetId,
        container: container,
        text: "Chat",
        action: chatAction(currUserId, targetId),
    };
    util.createButton(params);
}

function addStartGameButton(container, currUserId, targetId) {
    const params = {
        id: container.id + "-game-user-" + targetId,
        container: container,
        text: "Start Game",
        action: startGameAction(currUserId, targetId),
    };
    util.createButton(params);   
}

// -- actions ----
function blockAction(userId, block=true) {
    const options = {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: userId }),
    };
    if (!block) {
        options.method = "DELETE";
    }
    return () => {
        console.log(block ? "" : "un" + "blocking userId:", userId);
        api.fetchRoute({
            route: "/api/block/",
            options: options,
            dataManager: (_) => {
                refresh();
            }
        });
    };
}

function chatAction(currUserId, targetId) {
    const roomId = [currUserId, targetId].sort().join("_");
    return () => {
        chat.startChat(roomId);
    };
}

function startGameAction(currUserId, targetId) {
    return () => {
        console.log(`Start Game not implemented:\n${currUserId} vs ${targetId}`);
    };
}

export { getUser, setUser, removeUser, displayUser };
