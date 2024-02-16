function display(id, display) {
    const element = document.getElementById(id);
    element.style.display = display;
}

// -- form ----
function formSubmit(formId, callback) {
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
    .then(callback)
    .then((_) => {
        clearForm(formId);
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


export { display, formSubmit };