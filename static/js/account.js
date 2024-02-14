import * as util from "/static/js/util.js";

function displayFriends() {
    util.display("account-friends", "block");
}

function hideFriends() {
    util.display("account-friends", "none");
}

function displayInfo() {
    util.display("account-info", "block");
}

function hideInfo() {
    util.display("account-info", "none");
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

export { displayFriends, displayInfo, displayStats, hideAll };