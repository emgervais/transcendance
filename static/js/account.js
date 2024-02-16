import * as util from "/static/js/util.js";

// -- display ----
function displayFriends() {
    util.display("account-friends", "block");
}

function hideFriends() {
    util.display("account-friends", "none");
}

function displayInfo() {
    util.display("account-update-info", "block");
}

function hideInfo() {
    util.display("account-update-info", "none");
}

function displayStats() {
    util.display("account-stats", "block");
}

function hideStats() {
    util.display("account-stats", "none");
}

function hideAll() {
    hideFriends();
    hideInfo();
    hideStats();
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

export { displayFriends, displayInfo, displayStats, hideAll };
export { updateInfoButton, updatePasswordButton };