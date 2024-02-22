import * as util from "/static/js/util.js";
import * as api from "/static/js/api.js";
import { getUser, updateUser } from "/static/js/user.js";

// -- display ----
function displayFriendsPage() {
    util.display("account-friends");
    getFriends();
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


// username image oauth friend_requests friends matches
// token: access, refresh
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
            console.log(friends);
            friends.forEach(friend => {
                const div = document.createElement("div");
                div.className = "friend";
                const img = document.createElement("img");
                img.src = "/" + friend.image;
                const p = document.createElement("p");
                p.textContent = friend.username;
                div.appendChild(img);
                div.appendChild(p);
                container.appendChild(div);
            })
        }
    });
}

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };