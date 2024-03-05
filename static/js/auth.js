import * as api from "/js/api.js";
import * as chatTriggers from "/js/chat/triggers.js";
import * as nav from "/js/nav.js";
import * as notifications from "/js/notifications.js";
import * as router from "/js/router.js";
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
        chatTriggers.closeChatBox();
    }
    nav.setConnected(connected);
    localStorage.setItem("connected", connected);
}

// -- login ----
function login(user, redirect=true) {
    setCurrUser(user);
    setConnected(true);
    displayCurrUser();
    if (redirect) {
        router.route("/");
    }
    reconnecting = false;
    notifications.start()
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
        dataManager: data => {
            console.log("Successful logout\n", data);
            setConnected(false);
            sessionStorage.removeItem("messages");
            router.route("/");
        }
    });
}

function oauthRedirected() {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    if (!code)
        return false;
    const loading = document.querySelector(".loading-container");
    util.display(loading);
    api.fetchRoute({
        route: "/api/oauth42-login/",
        options: {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code: code }), 
        },
        dataManager: (data) => {
            login(data);
            util.display(loading, false);
        }
    });
    return true;
}


export { loginButton, registerButton, oauthButton };
export { isConnected, setConnected };
export { confirmLogin, logout, oauthRedirected, reConnect };