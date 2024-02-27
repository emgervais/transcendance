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

// -- buttons ----
const button_actions = {};

function createButton({text, id, action, container}) {
    const button = document.createElement("button");
    button.innerText = text;
    button.id = id;
    button_actions[id] = action;
    button.addEventListener("click", button_actions[id]);
    container.appendChild(button);
}

function deleteButton(id) {
    const button = document.getElementById(id);
    button.removeEventListener("click", button_actions[id]);
    delete button_actions["id"];
    button.remove();
}

// -- sleep ----
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { isDisplayed, display, toggleDisplay };
export { createButton, deleteButton };
export { sleep };