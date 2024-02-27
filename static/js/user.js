import * as util from "/js/util.js";
import * as api from "/js/api.js";
// save user info in sessionStorage
// if exists, use, else fetch /api/user/id/
// no id: "user"
// id: "user-id"

var users = {};

// -- singletons ----
// No id means current user.
function getCurrUser() {
    let key = "user";
    let user = JSON.parse(sessionStorage.getItem(key));
    return user;
}

function setCurrUser(user) {
    if (!user) {
        throw new Error("setCurrUser: Invalid user object provided.");
    }
    let key = "user";
    sessionStorage.setItem(key, JSON.stringify(user));
}

function updateCurrUser(data) {
    const user = getCurrUser();
    for (const key in data) {
        if (key in user) {
            console.log(key, ":", data[key]);
            user[key] = data[key];
        }
    }
    setCurrUser(user);
    displayUser();
}

function removeCurrUser() {
    let key = "user";
    sessionStorage.removeItem(key);
}

async function getUser(id) {
    let key = "user-" + id;
    if (key in users) {
        return users[key];
    }
    await api.fetchRoute({
        route: `/api/user/${id}/`,
        dataManager: user => {
            setUser(id, user);
        },
    });
    console.log("getUser, id:", id, "user:", users[key]);
    return users[key];
}

function setUser(id, user) {
    let key = "user-" + id;
    users[key] = {
        username: user.username,
        image: user.image,
    };
}

function removeUser(id) {
    let key = "user-" + id;
    delete users[key];
}
// --

function displayUserImage(image) {
    document.querySelectorAll("img.user-img").forEach(element => {
        element.src = image;
    });
}

function displayUserName(username) {
    document.querySelectorAll(".user-username").forEach(element => {
        element.innerText = username;
    });
}

function displayUser() {
    let image = ""
    let username = "";
    let user = getCurrUser();
    if (user) {
        image = user.image;
        username = user.username;
    }
    displayUserImage(image);
    displayUserName(username);
}

export { getCurrUser, setCurrUser, updateCurrUser, removeCurrUser };
export { getUser, setUser, removeUser };
export { displayUser };
