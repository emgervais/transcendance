import * as util from "/js/util.js";

function setConnected(connected) {
    document.querySelectorAll('.connected').forEach((element) => {
        util.display(element, connected);
    });
    document.querySelectorAll('.anonymous').forEach((element) => {
        util.display(element, !connected);
    });
}

function displayFriendRequests() {

}

// -- authContainer ----
const authContainer = document.getElementById("authentication-container");
const shadow = document.getElementById("shadow");
const login = document.getElementById("login");
const register = document.getElementById("register");

function displayAuthContainer() {
    util.display(authContainer);
    util.display(shadow);
}

function hideAuthContainer() {
    util.display(authContainer, false);
    util.display(shadow, false);
}

function displayLogin() {
    util.display(login);
    util.display(register, false);
    displayAuthContainer();
}

function displayRegister() {
    util.display(login, false);
    util.display(register);
    displayAuthContainer();
    displayAuthContainer();  
}

export { setConnected };
export { displayLogin, displayRegister, hideAuthContainer };