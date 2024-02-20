import { route, locationHandler } from "/static/js/router.js";
import { confirmLogin, loginButton, registerButton } from "/static/js/auth.js";
import { buttons } from "/static/js/buttons.js";
import { oauthRedirected } from "/static/js/auth.js";

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
    const authContainerShown = document.querySelector("#shadow").style.display !== 'none';
    if (authContainerShown) {
        if (event.key === "Escape") {
            route("/");
        }
        if (event.key === "Enter") {
            const loginShown = document.querySelector("#login").style.display !== 'none';

            if (loginShown) {
                loginButton();
            } else {
                registerButton();
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    locationHandler();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    oauthRedirected() || confirmLogin();
});
