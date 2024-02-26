import * as account from "/js/account/account.js";
import * as api from "/js/api.js";
import * as auth from "/js/auth.js";
import * as chat from "/js/chat.js";
import * as friends from "/js/account/friends.js";
import * as router from "/js/routing.js";
import { updateUser } from "/js/user.js";
import * as util from "/js/util.js";

const buttons = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    
    "chat-toggle": chat.toggleDisplay,
    "chat-submit-button": chat.submit,

    "update-info-button": account.updateInfoButton,

    "friend-request-button": friends.makeFriendRequest
};

function click(event) {
    const { target } = event;
    if (target.matches("a[href]")) {
        event.preventDefault();
        router.route(event.target.href);
    }
    else if (target.id in buttons) {
        buttons[target.id]();
    }
}

function key(event) {

    switch (event.key) {
        case "Escape":
            key_escape();
            break;
        case "Enter":
            key_enter(event.target.id )
            break;
    }
}

function key_escape() {
    if (util.isDisplayed("authentication-container")) {
        router.route("/");
    }
}

function key_enter(id) {
    switch (id) {
        case "chat-message-input":
            chat.submit();
            return;
        case "friend-request-input":
            friends.makeFriendRequest();
            return;
    }
    if (util.isDisplayed("authentication-container")) {
        if (util.isDisplayed("login")) {
            auth.loginButton();
        } else if (util.isDisplayed("register")) {
            auth.registerButton();
        }
    }
}

function onChange(event) {
    switch (event.target.id) {
        case "user-img-changer":
            api.formSubmit({
                formId: "upload-image",
                callback: updateUser,
                method: "put"
            });
            break;
    }
}

export { click, key, onChange };