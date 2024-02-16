import { updateNav } from "/static/js/nav.js";
import { route } from "/js/router.js";
import { formSubmit } from "/js/util.js";


function loginButton() {
    formSubmit("login-form", login);
}

function registerButton() {
    formSubmit("register-form", login);
}

function login(data) {
    console.log(data);
    let userImg = document.querySelector("#imgDropdown");
    userImg.setAttribute('src', data.image);
    let username = document.querySelector("#usernameNav");
    username.innerText = data.username;
    updateNav(true);
    route("/");
}

function logout() {
    console.log("logout");
    fetch("/api/logout/", {
        method: "POST"
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Successful logoutL\n", data);
        updateNav(false);
    })
    .catch(error => {
        console.error('oauthButton error:', error);
    });
}

function oauthButton() {
	fetch('/api/oauth42-uri/')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        window.location.href = data.uri;
    })
    .catch(error => {
        console.error('oauthButton error:', error);
    });
}

function oauthLogin() {
    const queryParams = new URLSearchParams(window.location.search);
    if (!queryParams.has("code")) {
        return;
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
    .then(login)
    .catch(error => {
        console.error('Fetch error:', error);
    });
}

export {loginButton, registerButton, logout, oauthButton, oauthLogin};