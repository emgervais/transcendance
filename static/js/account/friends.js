import * as api from "/js/api.js";
import * as util from "/js/util.js";

function refresh() {
    getFriends();
    getFriendRequests();
}
function getFriends() {
    const friendManager = (friends) => {
        const container = document.getElementById("friends-container");
        container.innerHTML = '';
        friends.forEach(friend => {
            displayFriend(container, friend.friend);
        })
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendManager
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

// -- display ----
function displayFriend(container, friend) {
    const div = document.createElement("div");
    const appendToContainer = (data) => {
        div.className = "friend";
        const img = document.createElement("img");
        img.src = data.image;
        img.className = "img-fluid rounded-circle small-image";
        const p = document.createElement("p");
        p.textContent = data.username;
        div.appendChild(img);
        div.appendChild(p);
        container.appendChild(div);
    };
    api.fetchRoute({
        route: `/api/user/${friend}/`,
        dataManager: appendToContainer,
    })
    return div;
}

function displayFriendRequest(container, request) {
    const div = displayFriend(container, request.from_user);
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

function removeFriendRequestButtons() {
    const container = document.getElementById("friends-requests-container");
    const buttons = container.querySelectorAll("button");
    buttons.forEach(button => {
        if (button.id.includes("friend-request")) {
            util.deleteButton(button.id);
        }
    }); 
}

export { refresh, removeFriendRequestButtons, makeFriendRequest };
