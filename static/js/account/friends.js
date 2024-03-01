import * as api from "/js/api.js";
import { displayUser } from "/js/user/user.js";
import * as router from "/js/router.js";


function refresh() {
    if (router.getCurrentRoute().name == "friends") {
        getFriends();
        getFriendRequests();
        getBlockedUsers();
    }
}

function makeRequest() {
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
    const friendsManager = (friends) => {
        const container = document.getElementById("friends-container");
        container.innerHTML = '';
        friends.forEach(friend => {
            displayUser(container, friend.friend);
        })
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendsManager
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
async function displayFriendRequest(container, request) {
    const div = await displayUser(container, request.from_user);
    
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
    div.appendChild(acceptButton);
    div.appendChild(refuseButton);
}

// -- triggers ----
function answerRequest(target) {
    const accept = target.getAttribute("data-accept");
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

export { refresh, makeRequest, answerRequest};
