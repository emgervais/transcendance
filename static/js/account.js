import * as util from "/static/js/util.js";
import * as api from "/static/js/api.js";
import { getUser, updateUser } from "/static/js/user.js";

// -- display ----
function displayFriendsPage() {
    util.display("account-friends");
    getFriends();
    getFriendRequests();
}

function hideFriendsPage() {
    util.display("account-friends", false);
}

function displayInfoPage() {
    util.display("account-update-info");
    const user = getUser();
    util.display("change-password", !user.oauth);
}

function hideInfoPage() {
    util.display("account-update-info", false);
}

function displayStatsPage() {
    util.display("account-stats");
}

function hideStatsPage() {
    util.display("account-stats", false);
}

function hideAll() {
    hideFriendsPage();
    hideInfoPage();
    hideStatsPage();
}

// ----

function updateInfoButton() {
    api.formSubmit("update-info-form", (data) => {
        updateUser(data);
    }, "put");
}

function getFriends() {
    api.fetchRoute({
        route: "/api/friends/",
        dataManager: friends => {
            const container = document.querySelector("#friends-container");
            friends.forEach(friend => {
                displayFriend(container, friend.friend);
            })
        }
    });
}

function displayFriend(container, friend) {
    const div = document.createElement("div");
    const appendToContainer = (data) => {
        div.className = "friend";
        const img = document.createElement("img");
        img.src = data.image;
        img.className = "img-fluid rounded-circle";
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

function getFriendRequests() {
        const container = document.getElementById("friends-requests-container");
        api.fetchRoute({
        route: "/api/friend-requests/",
        dataManager: requests => {
            requests.forEach(request => {
                console.log("friend requests:", request);
                const div = displayFriend(container, request.from_user);
                const acceptButton = document.createElement("button");
                acceptButton.innerText = "Accept";
                const refuseButton = document.createElement("button");
                refuseButton.innerText = "Refuse";
                div.appendChild(acceptButton);
                div.appendChild(refuseButton);
                // set button id: triggers.js (attribute for request_id?)
                // request.id
            });
        }
    })
    
}

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };