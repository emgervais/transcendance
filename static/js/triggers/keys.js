import * as auth from "/js/auth.js";
import * as chat from "/js/chat/chat.js";
import * as friends from "/js/account/friends.js";
import * as router from "/js/router.js";
import * as util from "/js/util.js";

const authContainer = document.getElementById("authentication-container");
const loginContainer = document.getElementById("login");
const registerContainer = document.getElementById("register");

function key(event) {
    switch (event.key) {
        case "Escape":
            keyEscape();
            break;
        case "Enter":
            keyEnter(event.target.id);
            break;
    }
}

function keyEscape() {
    if (util.isDisplayed(authContainer)) {
        router.route("/");
    }
}

function keyEnter(id) {
    switch (id) {
        case "chat-input":
            chat.submit();
            return;
        case "search-user-input":
            friends.searchUser();
            return;
    }
    if (util.isDisplayed(authContainer)) {
        if (util.isDisplayed(loginContainer)) {
            auth.loginButton();
        } else if (util.isDisplayed(registerContainer)) {
            auth.registerButton();
        }
    }
}

export { key };