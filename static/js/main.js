import { route, locationHandler } from "/js/router.js";
import { buttons } from "/js/buttons.js";
import { oauthLogin } from "/js/auth.js";

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
