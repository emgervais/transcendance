import * as util from "/static/js/util.js";

// -- display ----
function displayFriendsPage() {
    util.display("account-friends", "block");
    getFriends();
}

function hideFriendsPage() {
    util.display("account-friends", "none");
}

function displayInfoPage() {
    util.display("account-update-info", "block");
}

function hideInfoPage() {
    util.display("account-update-info", "none");
}

function displayStatsPage() {
    util.display("account-stats", "block");
}

function hideStatsPage() {
    util.display("account-stats", "none");
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
    util.formSubmit("update-info-form", (e) => {console.log("result:", e)}, "put");
}

function updatePasswordButton() {
    util.formSubmit("update-password-form", (e) => {console.log("result:", e)}, "put");
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
export { updateInfoButton, updatePasswordButton };