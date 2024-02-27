import * as util from "/js/util.js";
import * as api from "/js/api.js";
// save user info in sessionStorage
// if exists, use, else fetch /api/user/id/
// no id: "user"
// id: "user-id"

// -- singletons ----
// No id means current user.
async function getUser(id="") {
    let key = "user" + id;
    let user = JSON.parse(sessionStorage.getItem(key));
    if (id && !user) {
        await api.fetchRoute({
            route: `/api/user/${id}/`,
            dataManager: user => {
                setUser(user, id);
            },
        });
        user = JSON.parse(sessionStorage.getItem(key));
    }
    return user;
}

function setUser(user, id="") {
    if (!user) {
        throw new Error("setUser: Invalid user object provided.");
    }
    let key = "user" + id;
    sessionStorage.setItem(key, JSON.stringify(user));
}

async function updateUser(data, id="") {
    const user = await getUser(id);
    for (const key in data) {
        if (key in user) {
            console.log(key, ":", data[key]);
            user[key] = data[key];
        }
    }
    setUser(user, id);
    displayUser();
}

function removeUser(id="") {
    let key = "user" + id;
    sessionStorage.removeItem(key);
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

async function displayUser() {
    let image = ""
    let username = "";
    let user = await getUser();
    if (user) {
        image = user.image;
        username = user.username;
    }
    displayUserImage(image);
    displayUserName(username);
}

export { getUser, setUser, updateUser, displayUser, removeUser };
