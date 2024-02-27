import * as router from "/js/router.js";
import * as auth from "/js/auth.js";

// -- block fetch ----
var blockFetch = false;
function setBlockFetch(bool) {
    blockFetch = bool;
    console.log("setBlockFetch:", blockFetch);
}
// --

// -- fetch ----
async function fetchRoute(params, retrying=false){
    if (blockFetch) {
        console.log("blocked fetch due to 403. blockFetch:", blockFetch);
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
                route: "/api/refresh-token/",
                options: { method: "POST" },
                dataManager: (_) => {
                    console.log("Renewed Access Token");
                },
            });
            break;
        case 403:
            setBlockFetch(true);
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

// -- form ----
// body=true
// body = body ? new FormData(form): null
//
function formSubmit(
    {
        formId,
        route=undefined,
        callback,
        method=undefined,
        body=undefined,
    }) {
    const form = document.getElementById(formId);
    if (!form) {
        console.error('Form "' + formId + '" not found');
        return;
    }
    removeFormErrors();
    method = method ? method : form.method;
    if (body === undefined) {
        body = new FormData(form);
    } else if (body === null) {
        body = undefined;
    }
    const options = {
        method: method,
        body: body,
    };
    const dataManager = (data) => {
        callback(data);
        clearForm(formId);
    };
    route = route ? route : form.action;
    const formErrorManager = error => {
        console.log("error.status:", error.status);
        console.log("error.data:", error.data);
        if (error.status && error.data) {
            addFormErrors(form, error.data);
            return;
        }
        fetchError(error);
    };
    fetchRoute({
        route: route,
        options: options,
        dataManager: dataManager,
        errorManager: formErrorManager
    })
}

// -- form errors ----
function addFormErrors(form, data) {
    for (const [key, value] of Object.entries(data)) {
        addFormError(form, key, value);
    }
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

// -- clear form ----
function clearForm(formId) {
    const form = document.getElementById(formId);
    const inputFields = form.querySelectorAll('input');
    inputFields.forEach(input => {
        if (input.value) {
            input.value = '';
        }
    });
}

export { formSubmit, fetchRoute, setBlockFetch };
export { addFormErrors ,removeFormErrors };