import * as auth from "/js/auth.js";
import * as chat from "/js/chat/chat.js";
import * as friends from "/js/account/friends.js";
import * as router from "/js/router/router.js";
import * as util from "/js/util.js";
import * as accountInfo from "/js/account/info.js";

const authContainer = document.getElementById("authentication-container");

function key(event) {
    switch (event.key) {
        case "Escape":
            keyEscape();
            break;
        case "Enter":
            keyEnter(event.target);
            break;
    }
}

function keyEscape() {
    if (util.isDisplayed(authContainer)) {
        router.route("/");
    }
}

function keyEnter(target) {
    switch (target.id) {
        case "chat-input":
            chat.submit();
            return;
        case "search-user-input":
            friends.searchUser();
            return;
    }
    for (const className of target.classList) {
        switch (className) {
            case "login-input":
                auth.loginButton();
                return;
            case "register-input":
                auth.registerButton();
                return;
            case "update-info-input":
                accountInfo.updateInfoButton();
                return;
        }
    }    
}

export { key };