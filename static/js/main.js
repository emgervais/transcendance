import * as router from "/js/router/router.js";
import * as auth from "/js/auth.js";
import * as triggers from "/js/triggers/triggers.js";
import * as tests from "/js/test_messages.js";

document.addEventListener("DOMContentLoaded", async () => {
    auth.oauthRedirected() || auth.confirmLogin();
    router.locationHandler();
    tests.setMessages();
    triggers.startEventListeners();
});
