import { updateNav } from "/static/js/nav.js";
import { route } from "/js/router.js";
import * as api from "/static/js/api.js";
import { getUser, setUser } from "/static/js/user.js";

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
    updateNav(true, user.image);
    if (redirect) {
        route("/");
    }
}

function confirmLogin() {
    console.log("confirmLogin");
    // let user = JSON.parse(sessionStorage.getItem("user"));
    // if (!user)
    // {
    //     user = {
    //         "id": 21,
    //         "username": "francoma",
    //         "email": "ffrancoismmartineau@gmail.com",
    //         "image": "/default/default.webp",
    //         "oauth": false,
    //         "matches": [],
    //         "friends": [],
    //         "friend_requests": []
    //     }
    // }
    // fetch("/api/user/")
    // .then(api.fetchResponse)
    let user = getUser();
    if (user) {
        login(user, false);
    }
    // console.log("confirmLogin");
    // fetch("/api/confirm-login/")
    // .then(api.fetchResponse)
    // .then(login)
    // .catch(api.fetchError);
}

function logout() {
    sessionStorage.removeItem("user");
    api.fetchRoute({
        route: "/api/logout/",
        options: { method: "POST" },
        dataManager: data => {
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
    route("/");
    alert("Please login");
    route("/login/");
}

export { loginButton, registerButton, oauthButton };
export { confirmLogin, logout, oauthRedirected, unauthorized };