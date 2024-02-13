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

    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            if (document.querySelector("#shadow").style.display !== 'none')
            {
                window.history.back();
            }
        }
    });   
});
