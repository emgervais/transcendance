import * as api from "/js/api.js";
import * as match from "/js/pong/match.js";
import * as notifications from "/js/notifications.js";
import * as router from "/js/router/router.js";
import * as util from "/js/util.js";
import { displayCurrUser, setCurrUser, removeCurrUser } from "/js/user/currUser.js";

// -- buttons ----
function loginButton() {
    api.formSubmit({
        formId: "login-form",
        callback: login
    });    
}

function registerButton() {
    api.formSubmit({
        formId: "register-form",
        callback: login
    });
}

function oauthButton() {
    api.fetchRoute({
        route: "/api/oauth42-uri/",
        dataManager: data => {
            window.location.href = data.uri;
        }
    });
}

// -- singletons ----
function isConnected() {
    return JSON.parse(localStorage.getItem("connected"));
}

function setConnected(connected) {
    if (!connected) {
        removeCurrUser();
    }
    localStorage.setItem("connected", connected);
    util.displayState();
}

// -- login ----
async function login(user, redirect=true) {
    setCurrUser(user);
    if (redirect) {
        await router.route("/");
    }
    setConnected(true);
    displayCurrUser();
    reconnecting = false;
    notifications.start();
}

var reconnecting = false;
function reConnect() {
    if (reconnecting) {
        return;
    }
    reconnecting = true;
    setConnected(false);
    displayCurrUser();
    alert("Please login");
    router.route("/");
    router.route("/login/");
}

function confirmLogin() {
    console.log("isConnected():", isConnected());
    if (!isConnected()) {
        if (!router.getCurrentRoute().unprotected) {
            reConnect();
        }
        return;
    }
    api.fetchRoute({
        route: "/api/user/",
        dataManager: user => {
            login(user, false);
        },
        requireAuthorized: false,
    });
}
// ----

function logout() {
    api.fetchRoute({
        route: "/api/logout/",
        options: { method: "POST" },
        dataManager: async data => {
            sessionStorage.removeItem("messages");
            setConnected(false);
            match.cancelSearchingMatch();
            match.clearInvites();
            await router.route("/");
        }
    });
}

function oauthRedirected() {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    if (!code)
        return false;
    util.showAlert({ text: "Logging you in...", timeout: null});
    api.fetchRoute({
        route: "/api/oauth42-login/",
        options: {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code: code }), 
        },
        dataManager: (data) => {
            login(data);
            util.hideAlert();
        },
        errorManager: (error) => {
            router.route("/login/");
            let errMsg = "";
            for (let key in error.data) {
                errMsg += `${key}: ${error.data[key]}\n`;
            }
            util.hideAlert();
            util.showAlert({ text: errMsg, closeButton: true, danger: true });
        },
    });
    return true;
}

export { loginButton, registerButton, oauthButton };
export { isConnected };
export { confirmLogin, logout, oauthRedirected, reConnect };