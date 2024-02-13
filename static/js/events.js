import { route } from "/js/router.js";
import { buttons } from "/js/buttons.js";

document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("click", (e) => {
        const { target } = e;
        if (target.matches("a[href]")) {
            e.preventDefault();
            route(e.target.href);
        }
        else if (target.id in buttons) {
            buttons[target.id]();
        }
    });
});
