import * as account from "/js/account/account.js";
import * as api from "/js/api.js";
import * as auth from "/js/auth.js";
import * as chat from "/js/chat/chat.js";
import * as friends from "/js/account/friends.js";
import * as router from "/js/router.js";
import { updateCurrUser } from "/js/user/currUser.js";
import * as util from "/js/util.js";
import * as chatTriggers from "/js/chat/triggers.js";

// -- click ----
const idFunctions = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    
    "chat-toggle": chat.toggleDisplay,
    "chat-submit": chat.submit,
    "tab-global": chatTriggers.activateGlobalTab,
    "tab-friends": chatTriggers.activateFriendsList,
    "tab-game": chatTriggers.activateGameTab,

    "update-info-button": account.updateInfoButton,

    "friend-request-button": friends.makeFriendRequest,
};

const classFunctions = {
    'close-friend-chat': (target) => { chat.stop(target.getAttribute('data-roomid')); },
    'chat-friends-list': (target) => { chatTriggers.activateFriendsTab(target.id); },
    'chat-box-toggle': (_) => { chatTriggers.toggleChat(); },
    "profile-picture-chat": chatTriggers.activateMenu,
}

function callTargetFunction(target) {
    while (
        target
        && !callIdFunction(target)
        && !callClassFunctions(target)
    ) {
        target = target.parentElement;
    }
}

function callIdFunction(target) {
    if (target.id in idFunctions) {
        idFunctions[target.id]();
        return true;
    }
    return false;
}

function callClassFunctions(target) {
    target.classList.forEach(className => {
        if (className in classFunctions) {
            classFunctions[className](target);
            return true;
        }
    });
    return false;
}

function click(event) {
    const { target } = event;
    if (target.matches("a[href]")) {
        event.preventDefault();
        router.route(event.target.href);
    } else {
        callTargetFunction(target);
    }
}

// -- key ----
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
    if (util.isDisplayed("authentication-container")) {
        router.route("/");
    }
}

function keyEnter(id) {
    switch (id) {
        case "chat-input":
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

// -- change ----
function onChange(event) {
    switch (event.target.id) {
        case "user-img-changer":
            api.formSubmit({
                formId: "upload-image",
                callback: updateCurrUser,
                method: "put"
            });
            break;
    }
}

export { click, key, onChange };