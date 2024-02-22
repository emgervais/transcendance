import { updateNav } from "/static/js/nav.js";
import { route } from "/js/router.js";
import * as api from "/static/js/api.js";
import { getUser, setUser, removeUser } from "/static/js/user.js";

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
    updateNav(true);
    if (redirect) {
        route("/");
    }
}

function reConnect() {
    setConnected(false);
    alert("Please login");
    route("/login/");
}

function confirmLogin() {
    if (!isConnected()) {
        return;
    }
    api.fetchRoute({
        route: "/api/user/",
        dataManager: user => {
            login(user, false);
        },
        requireAuthorized: false,
        errorManager: error => {
            if (error.status == 400 || error.status == 403) {
                setConnected(false);
            }
        },
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
            route("/");
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
export { setConnected };
export { confirmLogin, logout, oauthRedirected, reConnect };