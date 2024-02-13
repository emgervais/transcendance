import { updateNav, hideAuthContainer } from "/js/nav.js";
import { route } from "/js/router.js";

export function loginButton() {
    formSubmit("login-form");
}

export function registerButton() {
    formSubmit("register-form");
}

function formSubmit(formId) {
    removeFormErrors();
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    fetch(form.action, {
        method: form.method,
        body: formData,
        // headers: { X-CSRFToken': formData.get('csrfmiddlewaretoken') },
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
                const div = form.querySelector("." + key);
                const error = document.createElement('p');
                error.className = "form-error";
                error.innerText = value;
                div.appendChild(error);
                console.log(`${key}: ${value}`);
            }
        } else {
            console.error('Network error or server not responding');
        }
    });
}

function removeFormErrors() {
    let errors = document.querySelectorAll(".form-error");
    errors.forEach((error) => {
        error.outerHTML = "";
    });
}

function login(data) {
    // imgDropdown
    let userImg = document.querySelector("#imgDropdown");
    userImg.setAttribute('src', data.image);
    let username = document.querySelector("#usernameNav");
    username.innerText = data.username;

    updateNav(true);

    // username image oauth friend_requests friends matches
    // token: access, refresh
}


export function oauthButton() {
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
