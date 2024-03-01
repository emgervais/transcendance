// -- display ----
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

function toggleDisplay(id) {
    display(id, !isDisplayed(id));
}

function toggleClass(element, _class) {
    if (element.classList.contains(_class)) {
		element.classList.remove(_class);
    } else {
		element.classList.add(_class);
    }
}

function setClass(element, _class, state) {
    if (!state && element.classList.contains(_class)) {
		element.classList.remove(_class);
    } else if (state && !element.classList.contains(_class)) {
		element.classList.add(_class);
    }
}

// -- sleep ----
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { isDisplayed, display, toggleDisplay, toggleClass, setClass };
export { sleep };