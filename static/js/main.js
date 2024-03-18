import * as auth from "/js/auth.js";
import * as router from "/js/router/router.js";
import * as triggers from "/js/triggers/triggers.js";

document.addEventListener("DOMContentLoaded", async () => {
    auth.oauthRedirected() || auth.confirmLogin();
    router.locationHandler();
    triggers.startEventListeners();
});
