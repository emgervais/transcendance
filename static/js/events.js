import { route } from "/js/router.js";
import { buttons } from "/js/buttons.js";

document.addEventListener("click", (e) => {
    const { target } = e;
    if (target.matches("a[href]")) {
        e.preventDefault();
        route(e);
    }
    else if (target.id in buttons) {
        buttons[target.id]();
    }
});