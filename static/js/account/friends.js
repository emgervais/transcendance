import * as api from "/js/api.js";
import { displayUser } from "/js/user/user.js";
import { getCurrUser } from "/js/user/currUser.js";
import * as router from "/js/router.js";

function refresh() {
    if (router.getCurrentRoute().name == "friends") {
        getFriends();
        getFriendRequests();
        getBlockedUsers();
    }
}

function searchUser() {
    const formId = "search-user-form";
    const input = document.getElementById("search-user-input");
    const query = input.value;
    if (!query) {
        return;
    }
    const container = document.getElementById("users-container");
    container.innerHTML = "";
    api.removeFormErrors();
    const usersCallback = async users => {
        if (users.length === 0) {
            container.innerText = `No potential friends found with "${query}".`;
        }
        users.forEach(user => {
            displayUser({
                container: container,
                userId: user.id,
                friendRequestable: true,
            });
        });
    };

    const makeParams = ()  => {
        const params = new URLSearchParams();
        params.append('is-friend', 'false');
        params.append('friend-request-sent', 'false');
        return "?" + params.toString();
    };
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
    const friendsManager = (friends) => {
        const container = document.getElementById("friends-container");
        container.innerHTML = '';
        friends.forEach(friend => {
            displayUser({
                container: container,
                userId: friend.friend,
                friendshipId: friend.id,
            });
        })
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendsManager
    });
}

async function getFriendIds() {
    let friendIds = [];
    await api.fetchRoute({
        route: "/api/friends/",
        dataManager: data => { friendIds = data.map(friend => friend.friend) },
    });
    return friendIds;
}

function getBlockedUsers() {
    const blockedUsersManager = (users) => {
        const container = document.getElementById("blocked-users-container");
        container.innerHTML = '';
        users.forEach(user => {
            displayUser({
                container: container,
                userId: user.blocked,
                blocked: true
            });
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
        container: container,
        userId: request.from_user
    });
    
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

}

export { refresh, searchUser, answerRequest, makeRequest };
