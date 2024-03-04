import * as util from "/js/util.js";
import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import { getCurrUser, updateCurrUser } from "/js/user/currUser.js";

const friendsPage = document.getElementById("account-friends");
const updateInfo = document.getElementById("account-update-info");
const updatePassword = document.getElementById("change-password");
const statsPage = document.getElementById("account-stats");

// -- display ----
function displayFriendsPage() {
    util.display(friendsPage);
    friends.refresh();
}

function hideFriendsPage() {
    util.display(friends, false);
}

function displayInfoPage() {
    util.display(updateInfo);
    const user = getCurrUser();
    util.display(updatePassword, !user.oauth);
}

function hideInfoPage() {
    util.display(updateInfo, false);
}

function displayStatsPage() {
    util.display(statsPage);
}

function hideStatsPage() {
    util.display(statsPage, false);
}

function hideAll() {
    hideFriendsPage();
    hideInfoPage();
    hideStatsPage();
}

// ----

function updateInfoButton() {
    api.formSubmit({
        formId: "update-info-form",
        callback: updateCurrUser,
        method: "put"
    });
}

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };