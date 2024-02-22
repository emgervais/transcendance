import { updateNav } from "./utils.js";

function registerButton(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    const registerForm = document.getElementById('register-form');
    const formData = new FormData(registerForm);

    fetch('/register/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': '{{ csrf_token }}',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.success) {
            const floatingBox = document.getElementById("floating-box");
            floatingBox.style.display = "none";
            updateNav(true);           
        }
        if (data.error) {
            const formError = document.getElementById("form-error");
            formError.innerHTML = data.error;
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });        
}

const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', registerButton);