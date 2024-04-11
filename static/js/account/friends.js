import * as api from "/js/api.js";
import * as nav from "/js/nav.js";
import * as router from "/js/router/router.js";
import * as util from "/js/util.js";
import { displayUser, getUser, sortUsers } from "/js/user/user.js";

const QUERY_PARAMS = {
    "is-friend": "false",
    "friend-request-sent": "false",
    "friend-request-received": "false",
    "is-blocked": "false",
    "got-blocked": "false",
}

function refresh() {
    if (router.getCurrentRoute().name == "friends") {
        getFriends();
        getFriendRequests();
        getBlockedUsers();
    }
}

function isValidString(input) {
    const pattern = /^[a-zA-Z0-9_]+$/;
    return pattern.test(input);
}

function searchUser() {
    const formId = "search-user-form";
    const input = document.getElementById("search-user-input");
    const query = input.value;
    const container = document.getElementById("users-container");
    container.innerHTML = "";
    if (!query || !isValidString(query)) {
        container.innerText = `Not a valid username bozo`;
        return;
    }
    api.removeFormErrors();
    const usersCallback = async users => {
        if (users.length === 0) {
            container.innerText = `No potential friends found with "${query}".`;
        }
        users.forEach(async user => {
            const div = await displayUser({
                userId: user.id,
                friendRequestable: true,
            });
            container.appendChild(div);
        });
    };

    const makeParams = () => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(QUERY_PARAMS)) {
            params.append(key, value);
        }
        return "?" + params.toString();
    }
    api.formSubmit({
        formId: formId,
        route: "/api/search/" + query + "/" + makeParams(),
        body: null,
        callback: usersCallback
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
    const friendsManager = async friends => {
        const container = document.getElementById("friends-container");
        container.innerHTML = '';
        await Promise.all(
            friends.map(async friend => {
                const div = await displayUser({
                    userId: friend.friend,
                    friendshipId: friend.id,
                    includeGameButton: true,
                });
                container.appendChild(div);
            })
        );
        sortUsers(container);
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendsManager
    });
}

// -- online friends count ----
let onlineFriendsCount = 0;
function setOnlineFriendsCount(count) {
    count = count < 0 ? 0 : count;
    onlineFriendsCount = count;
    const element = document.getElementById("online-friends-count");
    element.innerHTML = `${count} connected friend${count > 1 ? "s" : ""}`;
}

function incrOnlineFriendsCount(connected, disconnected) {
    let incr = 0;
    if (connected)
        incr = 1;
    else if (disconnected)
        incr = -1;
    else
        return;
    setOnlineFriendsCount(onlineFriendsCount + incr);
}
// --

function getBlockedUsers() {
    const blockedUsersManager = (users) => {
        const container = document.getElementById("blocked-users-container");
        container.innerHTML = '';
        users.forEach(async user => {
            const div = await displayUser({
                userId: user.blocked,
                blocked: true
            });
            container.appendChild(div);
        })
    };    
    api.fetchRoute({
        route: "/api/block/",
        dataManager: blockedUsersManager
    });    
}


// -- display ----
async function displayFriendRequest(container, request) {
    const div = await displayUser({
        userId: request.from_user
    });
    container.appendChild(div);
    
    const makeButton = (text, accept) => {
        const button = document.createElement("button");
        button.innerText = text;
        button.classList.add('friend-request-button');
        button.setAttribute("data-accept", accept);
        button.setAttribute("data-request-id", request.id);
        return button;
    };
    const acceptButton = makeButton("Accept", true);
    const refuseButton = makeButton("Refuse", false);
    const buttonDiv = div.querySelector('.user-buttons');
    buttonDiv.appendChild(acceptButton);
    buttonDiv.appendChild(refuseButton);
}

// -- triggers ----
function answerRequest(target) {
    const accept = target.getAttribute("data-accept") == "true";
    const method = accept ? "put" : "delete";
    const requestId = target.getAttribute("data-request-id");
    api.fetchRoute({
        route: "/api/friend-requests/" + requestId + "/",
        options: { method: method },
        dataManager: (_) => {
            refresh();
        }
    });
}

function makeRequest(target) {
    const userId = target.getAttribute("data-user-id");
    api.fetchRoute({
        route: "/api/friend-requests/",
        options: {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({"to_user": userId }), 
        },
        dataManager: data => {
            console.log("successful friend request:", data);
        },
    })
    // get closest of class "user"
    const userElement = target.closest(".user");
    userElement.remove();
}

// -- notifications ----
async function receiveFriendRequest(data) {
    util.showAlert({
        text: `${(await getUser(data.userId)).username} sent you a friend request.`,
        timeout: 2,
    });				
    nav.incrFriendRequestCount();
    if (router.getCurrentRoute().name == "friends") {
        const container = document.getElementById("friends-requests-container");
        displayFriendRequest(container, {
            from_user: data.userId,
            id: data.id
        });
    }
}

export { refresh, searchUser, answerRequest, makeRequest };
export { setOnlineFriendsCount, incrOnlineFriendsCount };
export { receiveFriendRequest };
