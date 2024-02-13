import { updateNav, hideAuthContainer } from "/js/nav.js";
import { route } from "/js/router.js";

function loginButton() {
    formSubmit("login-form");
}

function registerButton() {
    formSubmit("register-form");
}

// -- form ----
function formSubmit(formId) {
    removeFormErrors();
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    fetch(form.action, {
        method: form.method,
        body: formData,
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            return response.json().then(errorData => {
                throw { status: response.status, data: errorData };
            });
        }        
    })
    .then(data => {
        console.log(data);
        route("/");
        login(data);
    })
    .catch(error => {
        console.log(error.data)
        if (error.status && error.data) {
            for (const [key, value] of Object.entries(error.data)) {
                addFormError(form, key, value);
            }
        } else {
            console.error('Network error or server not responding');
        }
    });
}

function addFormError(form, key, value) {
    const div = form.querySelector("." + key);
    const error = document.createElement('p');
    error.className = "form-error";
    error.innerText = value;
    div.appendChild(error);
    console.log(`${key}: ${value}`);  
}

function removeFormErrors() {
    let errors = document.querySelectorAll(".form-error");
    errors.forEach((error) => {
        error.outerHTML = "";
    });
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    const inputFields = form.querySelectorAll('input');
    inputFields.forEach(input => {
        if (input.value) {
            input.value = '';
        }
    });
}
// --

function login(data) {
    let userImg = document.querySelector("#imgDropdown");
    userImg.setAttribute('src', data.image);
    let username = document.querySelector("#usernameNav");
    username.innerText = data.username;
    updateNav(true);
    // username image oauth friend_requests friends matches
    // token: access, refresh
}

function logout() {
    console.log("logout");
    updateNav(false);
    //  /logout/
    clearForm("login-form");
    clearForm("register-form");
}

function oauthButton() {
	fetch('/api/oauth42/')
		.then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			console.log(response);
			return response.json();
		})
		.then(data => {
			window.location.href = data.url;
		})
		.catch(error => {
			console.error('Fetch error:', error);
		});
}

export {loginButton, registerButton, logout, oauthButton};