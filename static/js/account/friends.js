import * as api from "/js/api.js";
import * as util from "/js/util.js";
import * as chat from "/js/websockets/chat.js";
import { getUser } from "/js/user.js";

function refresh() {
    getFriends();
    getFriendRequests();
    getBlockedUsers();
}

function makeFriendRequest() {
    const formId = "friend-request-form";
    const input = document.getElementById("friend-request-input");
    const username = input.value;
    api.removeFormErrors();
    const userIdCallback = data => {
        const id = data.id;
        api.fetchRoute({
            route: "/api/friend-requests/",
            options: {
                method: "POST",
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({"to_user": id }), 
            },
            dataManager: data => {
                console.log("successful friend request:", data);
            },
            errorManager: error => {
                const form = document.getElementById(formId);
                const data = {"username": error.data["friend-request"]};
                api.addFormErrors(form, data);
            }
        })
    };
    api.formSubmit({
        formId: formId,
        route: "/api/user/" + username + "/",
        body: null,
        callback: userIdCallback
    });
}

function getFriendRequests() {
    const container = document.getElementById("friends-requests-container");
    container.innerHTML = '';
    const requestsManager = (requests) => {
        requests.forEach(request => {
            displayFriendRequest(container, request);
        })
    }
    api.fetchRoute({
        route: "/api/friend-requests/",
        dataManager: requestsManager
    });
}

function getFriends() {
    const friendManager = (friends) => {
        const container = document.getElementById("friends-container");
        container.innerHTML = '';
        friends.forEach(friend => {
            displayUser(container, friend.friend);
        })
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendManager
    });
}

function getBlockedUsers() {
    const blockedUsersManager = (users) => {
        const container = document.getElementById("blocked-users-container");
        container.innerHTML = '';
        users.forEach(user => {
            displayUser(container, user.blocked, true);
        })
    };    
    api.fetchRoute({
        route: "/api/block/",
        dataManager: blockedUsersManager
    });    
}


// -- display ----
async function displayUser(container, userId, blocked=false) {
    const div = document.createElement("div");
    const appendToContainer = (currUserId, data) => {
        div.className = "user";
        const img = document.createElement("img");
        img.src = data.image;
        img.className = "img-fluid rounded-circle small-image";
        div.appendChild(img);
        const username = document.createElement("p");
        username.textContent = data.username;
        div.appendChild(username);
        const status = document.createElement("p");
        status.textContent = data.status;
        div.append(status);
        container.appendChild(div);
        addBlockButton(container, userId, !blocked);
        addChatButton(container, currUserId, userId);
    };
    const currUserId = (await getUser()).id;
    let user = await getUser(userId);
    appendToContainer(currUserId, user);
    return div;
}

function displayFriendRequest(container, request) {
    const div = displayUser(container, request.from_user);
    const buttons = [
        {
            text: "Accept",
            id: "friend-request-accept-" + request.id,
            action: requestButtonAction(request.id, true),
            container: div,
        },
        {
            text: "Refuse",
            id: "friend-request-refuse-" + request.id,
            action: requestButtonAction(request.id, false),
            container: div,
        }
    ]
    buttons.forEach(util.createButton);
}

// -- buttons ----
function addBlockButton(container, userId, block) {
    const params = {
        id: "block-user-" + userId,
        container: container,
        text: "Block",
        action: blockButtonAction(userId, block),
    };
    if (!block) {
        params.text = "Unblock";
    }
    util.createButton(params);
}

function addChatButton(container, currUserId, targetId) {
    const params = {
        id: "chat-user-" + targetId,
        container: container,
        text: "Chat",
        action: chatButtonAction(currUserId, targetId),
    };
    util.createButton(params);
}

function removeFriendButtons() {
    const container = document.getElementById("account-friends");
    const buttons = container.querySelectorAll("button");

    buttons.forEach(button => {
        if (button.id.includes("friend-request")
            || button.id.includes("block-user")) {
            util.deleteButton(button.id);
        }
    });
}

function requestButtonAction(request_id, accept) {
    const method = accept ? "put" : "delete";
    return () => {
        api.fetchRoute({
            route: "/api/friend-requests/" + request_id + "/",
            options: { method: method },
            dataManager: (_) => {
                refresh();
            }
        });
    };
}

function blockButtonAction(user_id, block=true) {
    const options = {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user_id }),
    };
    if (!block) {
        options.method = "DELETE";
    }
    return () => {
        console.log(block ? "" : "un" + "blocking user_id:", user_id);
        api.fetchRoute({
            route: "/api/block/",
            options: options,
            dataManager: (_) => {
                refresh();
            }
        });
    };
}

function chatButtonAction(currUserId, targetId) {
    const room = [currUserId, targetId].sort().join("_");
    return () => {
        chat.startChat(room);
    };
}

export { refresh, removeFriendButtons, makeFriendRequest };
