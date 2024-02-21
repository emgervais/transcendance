import { route, locationHandler } from "/static/js/router.js";
import { confirmLogin, loginButton, registerButton } from "/static/js/auth.js";
import { buttons } from "/static/js/buttons.js";
import { oauthRedirected } from "/static/js/auth.js";
import * as util from "/static/js/util.js";

function click(event) {
    const { target } = event;
    if (target.matches("a[href]")) {
        event.preventDefault();
        route(event.target.href);
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
            route("/");
        }
    }
    if (event.key === "Enter") {
        if (loginShown) {
            loginButton();
        } else if (registerShown) {
            registerButton();
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    locationHandler();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    oauthRedirected() || confirmLogin();
});
