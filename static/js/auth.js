import { updateNav } from "/static/js/nav.js";
import * as router from "/js/router.js";
import * as api from "/static/js/api.js";
import { displayUser, setUser, removeUser } from "/static/js/user.js";

// -- buttons ----
function loginButton() {
    api.formSubmit("login-form", login);
}

function registerButton() {
    api.formSubmit("register-form", login);
}

function oauthButton() {
    api.fetchRoute({
        route: "/api/oauth42-uri/",
        dataManager: data => {
            window.location.href = data.uri;
        }
    });
}
// ----

// -- singletons ----
function isConnected() {
    return JSON.parse(sessionStorage.getItem("connected"));
}

function setConnected(connected) {
    if (!connected) {
        removeUser();
    }
    sessionStorage.setItem("connected", connected);
}
// ----

// -- login ----
function login(user, redirect=true) {
    setUser(user);
    setConnected(true);
    displayUser();
    updateNav(true);
    if (redirect) {
        router.route("/");
    }
    reconnecting = false;
}

var reconnecting = false;
function reConnect() {
    if (reconnecting) {
        return;
    }
    reconnecting = true;
    setConnected(false);
    alert("Please login");
    router.route("/");
    router.route("/login/");
}

function confirmLogin() {
    console.log("isConnected():", isConnected());
    if (!isConnected() && !router.getCurrentRoute().unprotected) {
        reConnect();
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
            removeUser();
            console.log("Successful logout\n", data);
            router.route("/");
            updateNav(false);
        }
    });
}

function oauthRedirected() {
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    if (!code)
        return false;
    api.fetchRoute({
        route: "/api/oauth42-login/",
        options: {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ code: code }), 
        },
        dataManager: login
    })
    return true;
}


export { loginButton, registerButton, oauthButton };
export { isConnected, setConnected };
export { confirmLogin, logout, oauthRedirected, reConnect };