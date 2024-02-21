import { route, locationHandler } from "/static/js/router.js";
import { confirmLogin, loginButton, registerButton } from "/static/js/auth.js";
import { buttons } from "/static/js/triggers.js";
import { oauthRedirected } from "/static/js/auth.js";
import { updateUser } from "/static/js/user.js";
import * as util from "/static/js/util.js";
import * as api from "/static/js/api.js";

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
    locationHandler();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    document.addEventListener("change", onChange);
    oauthRedirected() || confirmLogin();

});
