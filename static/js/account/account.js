import * as util from "/js/util.js";
import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import { getCurrUser, updateCurrUser } from "/js/user/currUser.js";

// -- display ----
function displayFriendsPage() {
    const friendsPage = document.getElementById("account-friends");
    util.display(friendsPage);
    friends.refresh();
}

function hideFriendsPage() {
    const friendsPage = document.getElementById("account-friends");
    util.display(friendsPage, false);
}

function displayInfoPage() {
    const updateInfo = document.getElementById("account-update-info");
    util.display(updateInfo);
    const user = getCurrUser();
    const updatePassword = document.getElementById("change-password");
    util.display(updatePassword, !user.oauth);
}

function hideInfoPage() {
    const updateInfo = document.getElementById("account-update-info");
    util.display(updateInfo, false);
}

function displayStatsPage() {
    const statsPage = document.getElementById("account-stats");
    util.display(statsPage);
}

function hideStatsPage() {
    const statsPage = document.getElementById("account-stats");
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