import * as util from "/js/util.js";
import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import { getUser, updateUser } from "/js/user.js";

// -- display ----
function displayFriendsPage() {
    console.log("displayFriendsPage");
    util.display("account-friends");
    friends.refresh();
}

function hideFriendsPage() {
    console.log("hideFriendsPage");
    util.display("account-friends", false);
}

async function displayInfoPage() {
    console.log("displayInfoPage");
    util.display("account-update-info");
    const user = await getUser();
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
    api.formSubmit({
        formId: "update-info-form",
        callback: updateUser,
        method: "put"
    });
}

export { displayFriendsPage, displayInfoPage, displayStatsPage, hideAll };
export { updateInfoButton };