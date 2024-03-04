// -- display ----
function display(element, display=true) {
    if (display)
        element.classList.remove("hidden");
    else
        element.classList.add("hidden");
}

function isDisplayed(element) {
    return !element.classList.contains("hidden");
}

function toggleDisplay(element) {
    display(element, !isDisplayed(element));
}

function toggleClass(element, className) {
    if (element.classList.contains(className)) {
		element.classList.remove(className);
    } else {
		element.classList.add(className);
    }
}

function setClass(element, className, state) {
    if (!state && element.classList.contains(className)) {
		element.classList.remove(className);
    } else if (state && !element.classList.contains(className)) {
		element.classList.add(className);
    }
}

// -- sleep ----
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { isDisplayed, display, toggleDisplay, toggleClass, setClass };
export { sleep };