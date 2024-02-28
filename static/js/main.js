import * as router from "/js/router.js";
import * as auth from "/js/auth.js";
import * as triggers from "/js/triggers.js";
import * as chat from "/js/chat/chat.js";

document.addEventListener("DOMContentLoaded", async () => {
    auth.oauthRedirected() || auth.confirmLogin();
    router.locationHandler();
    chat.initChat();
    document.addEventListener("submit", event => { event.preventDefault(); });
    document.addEventListener("click", triggers.click);
    document.addEventListener("keydown", triggers.key);
    document.addEventListener("change", triggers.onChange);
});
