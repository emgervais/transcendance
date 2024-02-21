import * as util from "/static/js/util.js";
import * as nav from "/static/js/nav.js";

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
}

function hideInfoPage() {
    util.display("account-update-info", false);
}

function hideChangePassword() {
    const changePassword = document.querySelector("#change-password");
    if (changePassword) {
        changePassword.classList.add("hidden");
    }
}

function displayChangePassword() {

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
    util.formSubmit("update-info-form", (data) => {

        console.log("result:", data);
        if (data.image) {
            nav.updateUserImage(data.image);
        }
    }, "put");
}

function getFriends() {
    fetch("/api/friends/")
    .then(util.fetchResponse)
    .then(friends => {
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
        });        
    })
    .catch(util.fetchError);
}

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };