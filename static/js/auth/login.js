import { authContainerDisplay } from "/js/nav.js";

const login = {
    loginButton: function() {
        const loginForm = document.getElementById('login-form');
        const formData = new FormData(loginForm);
        fetch(loginForm.action, {
            method: loginForm.method,
            body: formData,
            // headers: {
            //     'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            // },
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            data = JSON.parse(data);
            if (data.success) {
                authContainerDisplay(hide=true);
            }
            if (data.email) {
                const formError = document.querySelector(".form-error");
                formError.innerHTML = data.email;
            }
        })
        .catch(error => {
            console.error('Error:', error.message);
        });
    }
};