import * as router from "/js/router.js";
import * as auth from "/js/auth.js";
import * as triggers from "/js/triggers.js";
import * as tests from "/js/test_messages.js";

document.addEventListener("DOMContentLoaded", async () => {
    auth.oauthRedirected() || auth.confirmLogin();
    router.locationHandler();
    tests.setMessages();
    document.addEventListener("submit", event => { event.preventDefault(); });
    document.addEventListener("click", triggers.click);
    document.addEventListener("keydown", triggers.key);
    document.addEventListener("change", triggers.onChange);
});
