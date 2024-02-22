import * as auth from "/static/js/auth.js";

function display(id, display=true) {
    const element = document.getElementById(id);
    if (display)
        element.classList.remove("hidden");
    else
        element.classList.add("hidden");
}

function isDisplayed(id) {
    return !document.getElementById(id).classList.contains("hidden");
}

export { isDisplayed, display };