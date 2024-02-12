import { hideAuthContainer } from "/js/nav.js";

export function loginButton() {
    formSubmit("login-button");
}

export function registerButton() {
    formSubmit("register-button");
}

function formSubmit(formId) {
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
            throw new Error(response.json());
        }
    })
    .then(data => {
        console.log(data);
        if (data.success) {
            hideAuthContainer();
        }
        if (data.email) {  // data.error: 
            const element = document.querySelector("#login-form#email");
            element.innerHTML = data.email;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
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
