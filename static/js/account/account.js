import * as util from "/js/util.js";
import * as friends from "/js/account/friends.js";
import * as stats from "/js/account/stats.js";
import { getCurrUser } from "/js/user/currUser.js";

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
    const nonOAuthElements = updateInfo.querySelector(".non-oauth");
    const user = getCurrUser();
    util.display(nonOAuthElements, !user.oauth);
}

function hideInfoPage() {
    const updateInfo = document.getElementById("account-update-info");
    util.display(updateInfo, false);
}

function displayStatsPage() {
    stats.load();
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

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };