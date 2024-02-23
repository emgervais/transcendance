import * as api from "/js/api.js";
import * as util from "/js/util.js";

// -- display ----
function displayFriend(container, friend) {
    const div = document.createElement("div");
    const appendToContainer = (data) => {
        // console.log("friend:", data);
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

function requestButtonAction(request_id, accept) {
    const method = accept ? "put" : "delete";
    return () => {
        api.fetchRoute({
            route: "/api/friend-requests/" + request_id + "/",
            options: { method: method },
        });
    };
}

function displayFriendRequest(container, request) {
    // console.log("friend requests:", request);
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
// --

// -- friends ----
function getFriends() {
    const friendManager = (friends) => {
        const container = document.getElementById("friends-container");
        friends.forEach(friend => {
            displayFriend(container, friend.friend);
        })
    };
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friendManager
    });
}
// --

// -- friend requests ----
function getFriendRequests() {
    const container = document.getElementById("friends-requests-container");
    const requestsManager = (requests) => {
        // console.log("requestsManager:", requests);
        requests.forEach(request => {
            // console.log("request:", request);
            displayFriendRequest(container, request);
        })
    }
    api.fetchRoute({
        route: "/api/friend-requests/",
        dataManager: requestsManager
    })
}

function removeFriendRequestButtons() {
    const container = document.getElementById("friends-requests-container");
    console.log("container:", container);
    const buttons = container.querySelectorAll("button");
    buttons.forEach(console.log);
}
// --

export { getFriends, getFriendRequests };
export { removeFriendRequestButtons };