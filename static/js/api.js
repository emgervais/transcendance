import * as auth from "/static/js/auth.js";

// -- fetch ----
function fetchRoute(params, retrying=false){
    const {
        route,
        options=null,
        responseManager=fetchResponse,
        dataManager=(_) => {},
        errorManager=fetchError,
        requireAuthorized=true,
    } = params;
    return fetch(route, options)
    .then(responseManager)
    .then(dataManager)
    .catch(async error => {
        if (requireAuthorized && !(await isAuthorized(error))) {
            if (retrying) {
                auth.reConnect();
                return;
            }
            fetchRoute(params, true);
            return;
        }
        errorManager(error);
    });
}

function fetchResponse(response) {
    if (response.ok) {
        return response.json();
    } else {
        return response.json().then(errorData => {
            throw { status: response.status, data: errorData };
        });
    }        
}

async function isAuthorized(error) {
    switch (error.status) {
        case 401:
            await fetchRoute({
                route: "/api/refresh/",
                options: { method: "POST" },
                dataManager: (_) => {
                    auth.confirmLogin();
                    console.log("Renewed Access Token");
                },
            });
            break;
        case 403:
            auth.reConnect();
            break;
        default:
            return true;
    }
    return false;
}

function fetchError(error) {
    console.log("fetchError");
    if (error.stack) {
        console.error(error.stack);
        return;
    }
    console.log(`HTTP error! Status: ${error.status}`);
    if (error.data) {
        console.log(`Error Data: ${error.data}\n`);
    }
}
// --

// -- form ----
function formSubmit(formId, callback, method=undefined) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error('Form "' + formId + '" not found');
        return;
    }    
    removeFormErrors();
    method = method ? method : form.method;
    const options = {
        method: method,
        body: new FormData(form),
    };
    const dataManager = (data) => {
        callback(data);
        clearForm(formId);
    };
    const errorManager = (error) => {
        console.log("error.status:", error.status);
        console.log("error.data:", error.data);
        if (error.status && error.data) {
            for (const [key, value] of Object.entries(error.data)) {
                addFormError(form, key, value);
            }
            return;
        }
        fetchError(error);
    };
    fetchRoute({
        route: form.action,
        options: options,
        dataManager: dataManager,
        errorManager: errorManager
    })
}

function addFormError(form, key, value) {
    const div = form.querySelector("." + key);
    if (!div) {
        return;
    }
    const error = document.createElement('p');
    error.className = "form-error";
    error.innerText = value;
    div.appendChild(error);
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


export { formSubmit, fetchRoute };