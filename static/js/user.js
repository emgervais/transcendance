// -- singletons ----
function getUser() {
    return JSON.parse(sessionStorage.getItem("user"));
}

function setUser(user) {
    if (!user) {
        throw new Error("setUser: Invalid user object provided.");
    }
    sessionStorage.setItem("user", JSON.stringify(user));
}

function updateUser(data) {
    const user = getUser();
    for (const key in data) {
        if (key in user) {
            user[key] = data[key];
        }
    }
    setUser(user);
    displayUser();
}

function removeUser() {
    sessionStorage.removeItem("user");
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
    let user = getUser();
    if (user) {
        image = user.image;
        username = user.username;
    }
    displayUserImage(image);
    displayUserName(username);
}

export { getUser, setUser, updateUser, displayUser, removeUser };
