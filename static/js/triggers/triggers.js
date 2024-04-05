import * as api from "/js/api.js";
import * as router from "/js/router/router.js";
import { updateCurrUser } from "/js/user/currUser.js";
import { key } from "/js/triggers/keys.js";
import { click } from "/js/triggers/clicks.js";

function onChange(event) {
    switch (event.target.id) {
        case "user-img-changer":
            api.formSubmit({
                formId: "upload-image",
                callback: updateCurrUser,
                method: "put"
            });
            break;
    }
}

function startEventListeners() {
    document.addEventListener("submit", event => { event.preventDefault(); });
    document.addEventListener("click", click);
    document.addEventListener("keydown", key);
    document.addEventListener("change", onChange);
    window.addEventListener("beforeunload", (_) => {
        const route = router.getCurrentRoute();
        if (route.onQuit)
            route.onQuit();
    });
    onwheel = () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            console.log("scroll");
        }
    };
}

export { startEventListeners };