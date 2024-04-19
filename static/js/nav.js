import * as util from "/js/util.js";
import * as auth from "/js/auth.js";

const friendRequestCountElement = document.querySelector("#friend-request-count");
let friendRequestCount = 0;

function updateFriendRequestCount(count) {
    const countElement = friendRequestCountElement.querySelector("#friend-request-counter");
    const button = countElement.closest("button");
    util.display(button, count != 0);
    if (count) {
        countElement.textContent = count + ' friend request' + (count > 1 ? 's' : '');
    } else {
        countElement.textContent = "";
    }
}

function incrFriendRequestCount(incr=1) {
    friendRequestCount += incr;
    friendRequestCount = friendRequestCount >= 0 ? friendRequestCount : 0;
    updateFriendRequestCount(friendRequestCount);
}

// -- authContainer ----
const authContainer = document.getElementById("authentication-container");
const shadow = document.getElementById("shadow");
const login = document.getElementById("login");
const register = document.getElementById("register");

function displayAuthContainer() {
    util.display(authContainer);
    util.display(shadow);
}

function hideAuthContainer() {
    util.display(authContainer, false);
    util.display(shadow, false);
}

function displayLogin() {
    auth.logout(false);
    util.display(login);
    util.display(register, false);
    displayAuthContainer();
}

function displayRegister() {
    auth.logout();
    util.display(login, false);
    util.display(register);
    displayAuthContainer();
}

export { updateFriendRequestCount, incrFriendRequestCount };
export { displayLogin, displayRegister, hideAuthContainer };