import * as auth from "/js/auth.js";
import * as match from "/js/pong/match.js";
import * as pong from "/js/pong/pong.js";
import * as util from "/js/util.js";

const defaultImage = '/media/default/default.webp';

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

const shadow = document.getElementById("shadow");
function clearFloatingBoxes() {
  display(shadow, false);
  const floatingBoxes = document.querySelectorAll(".floating-box");
  for (const floatingBox of floatingBoxes) {
    display(floatingBox, false);
  }
}

function displayState(cherryPick=undefined) {
  let classes = {
    'connected': auth.isConnected(),
    'searching-match': match.searchingMatch,
    'has-invites': !!match.invites.length,
    'match-button': pong.notInGame,
  };
  if (cherryPick) {
    classes = { [cherryPick]: classes[cherryPick] };
  }
  for (const [key, val] of Object.entries(classes)) {
    classes[key] = val;
    classes["not-" + key] = !val;
  }

  const querySelector = Object.keys(classes).map(cls => "." + cls).join(',');
  document.querySelectorAll(querySelector).forEach(element => {
    const display = Object.entries(classes).reduce(
      (acc, [key, val]) => element.classList.contains(key) ? acc && val : acc,
      true
    );
    util.display(element, display);
  });
}

// -- alert ----
const alertContainer = document.getElementById("alert-container");

async function showAlert({
  text,
  timeout=4,
  danger=false,
  closeButton=false,
}) {
  const alert = document.createElement("div");
  alert.classList.add("alert", "d-flex", "align-items-center", "alert-dismissible", "fade", "show");
  const addIcon = () => {
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:"><path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/></svg>`;
    alert.innerHTML += icon;
  };
  const addCloseButton = () => {
    const closeButton = `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alert.innerHTML += closeButton;
  };
  if (danger) {
    alert.classList.add("alert-danger");
    addIcon();
  } else {
    alert.classList.add("alert-primary");
  }
  const textElement = document.createElement("div");
  textElement.innerText = text;
  alert.appendChild(textElement);
  if (closeButton) {
    addCloseButton();
  }
  alertContainer.appendChild(alert);
  if (timeout) {
    const bsAlert = new bootstrap.Alert(alert);
    await sleep(timeout * 1000);
    bsAlert.close();
  }
}

function hideAlert() {
  alertContainer.innerHTML = "";
}

// -- sleep ----
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { defaultImage };
export { isDisplayed, display, toggleDisplay, toggleClass, setClass };
export { clearFloatingBoxes, displayState };
export { showAlert, hideAlert };
export { sleep };