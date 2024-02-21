import { updateNav } from "/static/js/nav.js";
import { route } from "/js/router.js";
import { formSubmit, fetchError, fetchResponse } from "/js/util.js";

// -- buttons ----
function loginButton() {
    formSubmit("login-form", login);
}

function registerButton() {
    formSubmit("register-form", login);
}
// ----

function login(user, redirect=true) {
    console.log(user);
    sessionStorage.setItem("user", JSON.stringify(user));
    let username = document.querySelector("#usernameNav");
    username.innerText = user.username;
    updateNav(true, user.image);
    if (redirect) {
        route("/");
    }
}

function confirmLogin() {
    let user = JSON.parse(sessionStorage.getItem("user"));
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
    if (user) {
        login(user, false);
    }
    // console.log("confirmLogin");
    // fetch("/api/confirm-login/")
    // .then(fetchResponse)
    // .then(login)
    // .catch(fetchError);
}

function logout() {
    sessionStorage.removeItem("user");
    console.log("logout");
    fetch("/api/logout/", {
        method: "POST"
    })
    .then(fetchResponse)
    .then(data => {
        console.log("Successful logout\n", data);
        route("/");
        updateNav(false);
    })
    .catch(fetchError);
}

function oauthButton() {
	fetch('/api/oauth42-uri/')
    .then(fetchResponse)
    .then(data => {
        window.location.href = data.uri;
    })
    .catch(fetchError);
}

function oauthRedirected() {
    let res = false;
    const queryParams = new URLSearchParams(window.location.search);
    if (!queryParams.has("code")) {
        return res;
    }
    const code = queryParams.get("code");
    fetch("/api/oauth42-login/", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code }), 
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        login(data);
        res = true;
    })
    .catch(fetchError);
    return res;
}

function unauthorized() {
    alert("Please login");
    route("/");
    route("/login/");
}

export {loginButton, registerButton, oauthButton};
export {confirmLogin, logout, oauthRedirected, unauthorized};