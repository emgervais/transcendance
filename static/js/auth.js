import { updateNav } from "/static/js/nav.js";
import { route } from "/js/router.js";
import { formSubmit } from "/js/util.js";

// -- buttons ----
function loginButton() {
    formSubmit("login-form", login);
}

function registerButton() {
    formSubmit("register-form", login);
}
// ----

function login(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
    let userImg = document.querySelector("#imgDropdown");
    userImg.setAttribute('src', user.image);
    let username = document.querySelector("#usernameNav");
    username.innerText = user.username;
    updateNav(true);
    route("/");
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
    if (user)
    {
        login(user);
    }
    // console.log("confirmLogin");
    // fetch("/api/confirm-login/")
    // .then(response => {
    //     if (!response.ok) {
    //         throw new Error(`HTTP error! Status: ${response.status}`);
    //     }
    //     return response.json();
    // })
    // .then(login)
    // .catch(error => {
    //     console.error('oauthButton error:', error);
    // });
}

function logout() {
    sessionStorage.removeItem("user");
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
    .catch(error => {
        console.error('Fetch error:', error);
    });
    return res;
}

function unauthorized() {
    alert("Please login");
    route("/login/")
}

export {loginButton, registerButton, oauthButton};
export {confirmLogin, logout, oauthRedirected, unauthorized};