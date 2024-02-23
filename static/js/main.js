import * as router from "/js/routing.js";
import { buttons } from "/js/triggers.js";
import * as auth from "/js/auth.js";
import { updateUser } from "/js/user.js";
import * as util from "/js/util.js";
import * as api from "/js/api.js";
import * as chat from "/js/chat.js";

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
    const loginShown = util.isDisplayed("login");
    const registerShown = util.isDisplayed("register");
    if (event.key === "Escape") {
        if (loginShown || registerShown) {
            router.route("/");
        }
    }
    if (event.key === "Enter") {
        if (event.target.id === "chat-message-input") {
            chat.submit();
        } else if (loginShown) {
            auth.loginButton();
        } else if (registerShown) {
            auth.registerButton();
        }
    }
}

function onChange(event) {
    switch (event.target.id) {
        case "user-img-changer":
            api.formSubmit("upload-image", data => {
                updateUser(data);
            } , "put");
            break;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    auth.oauthRedirected() || auth.confirmLogin();
    router.locationHandler();
    chat.initChat();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    document.addEventListener("change", onChange);
});
