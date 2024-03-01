import * as api from "/js/api.js";
import { displayUser } from "/js/user/user.js";
import * as util from "/js/util.js";


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
async function displayFriendRequest(container, request) {
    const div = await displayUser(container, request.from_user);
    const buttons = [
        {
            text: "Accept",
            id: "friend-request-accept-" + request.id,
            action: requestAction(request.id, true),
            container: div,
        },
        {
            text: "Refuse",
            id: "friend-request-refuse-" + request.id,
            action: requestAction(request.id, false),
            container: div,
        }
    ]
    buttons.forEach(util.createButton);
}

// -- buttons ----
function removeFriendButtons() {
    const container = document.getElementById("account-friends");
    const buttons = container.querySelectorAll("button");

    buttons.forEach(button => {
        util.deleteButton(button.id);
    });
}

// -- actions ----
function requestAction(request_id, accept) {
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

export { refresh, removeFriendButtons, makeFriendRequest };
