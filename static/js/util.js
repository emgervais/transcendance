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
// --

function createButton({text, id, action, container}) {
    const button = document.createElement("button");
    button.innerText = text;
    button.id = id;
    button.addEventListener("click", action);
    container.appendChild(button);
}

function deleteButton(id, action) {
    const button = document.getElementById(id);
    button.removeEventListener("click", action);
    button.remove();
}

export { isDisplayed, display, toggleDisplay };
export { createButton, deleteButton };