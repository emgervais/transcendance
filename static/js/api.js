import * as auth from "/static/js/auth.js";
import * as router from "/static/js/router.js";

// -- block fetch ----
var blockFetch = false;
function setBlockFetch(bool) {
    blockFetch = bool;
}
// --

// -- fetch ----
async function fetchRoute(params, retrying=false){
    if (blockFetch) {
        console.log("blocked fetch due to 403");
        return;
    }  
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
        if (!await isAuthorized(error)) {
            if (!retrying) {
                await fetchRoute(params, true);
                if (!auth.isConnected() && !router.getCurrentRoute().unprotected) {
                    auth.reConnect();
                }        
                return;
            }
            if (requireAuthorized) {
                auth.reConnect();
                return;
            }
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
                    console.log("Renewed Access Token");
                },
            });
            break;
        case 403:
            blockFetch = true;
            auth.reConnect();
            break;
        default:
            return true;
    }
    return false;
}

function fetchError(error) {
    if (error.stack) {
        console.error(error.stack);
        return;
    }
    console.log(`HTTP error! Status: ${error.status}`);
    if (error.data) {
        console.log(`Error Data:`);
        console.log(error.data);
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


export { formSubmit, fetchRoute, setBlockFetch };