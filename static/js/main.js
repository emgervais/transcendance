import { route, locationHandler } from "/static/js/router.js";
import { buttons } from "/static/js/buttons.js";
import { oauthLogin } from "/static/js/auth.js";

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
    oauthLogin();
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
});
