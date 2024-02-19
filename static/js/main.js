import { route, locationHandler } from "/static/js/router.js";
import { confirmLogin } from "/static/js/auth.js";
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
    if (event.key === "Escape") {
        if (document.querySelector("#shadow").style.display !== 'none')
        {
            route("/");
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    locationHandler();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    oauthRedirected() || confirmLogin();
});
