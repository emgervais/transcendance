import * as util from "/js/util.js";
import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import { getUser, updateUser } from "/js/user.js";

// -- display ----
function displayFriendsPage() {
    console.log("displayFriendsPage");
    util.display("account-friends");
    friends.getFriends();
    friends.getFriendRequests();
}

function hideFriendsPage() {
    console.log("hideFriendsPage");
    friends.removeFriendRequestButtons();
    util.display("account-friends", false);
}

function displayInfoPage() {
    console.log("displayInfoPage");
    util.display("account-update-info");
    const user = getUser();
    util.display("change-password", !user.oauth);
}

function hideInfoPage() {
    util.display("account-update-info", false);
}

function displayStatsPage() {
    console.log("displayStatsPage");
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

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };