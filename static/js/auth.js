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
// ----

function login(user, redirect=true) {
    setUser(user);
    let username = document.querySelector("#usernameNav");
    username.innerText = user.username;
    updateNav(true);
    if (redirect) {
        route("/");
    }
}

function confirmLogin() {
    if (getUser()) {
        api.fetchRoute({
            route: "/api/user/",
            dataManager: user => {
                login(user, false);
            },
            requireAuthorized: false,
            errorManager: error => {
                if (error.status == 401) {
                    console.log("REFUSED");
                    removeUser();
                }
            },
        });
    }
}

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

function oauthButton() {
    api.fetchRoute({
        route: "/api/oauth42-uri/",
        dataManager: data => {
            window.location.href = data.uri;
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

function unauthorized() {
    api.removeUser();
    route("/");
    alert("Please login");
    route("/login/");
}

export { loginButton, registerButton, oauthButton };
export { confirmLogin, logout, oauthRedirected, unauthorized };