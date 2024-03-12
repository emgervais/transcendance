
// -- singletons ----
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
    displayCurrUser();
}

function removeCurrUser() {
    let key = "user";
    sessionStorage.removeItem(key);
}

// -- display ----
function displayCurrUser() {
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

export { getCurrUser, setCurrUser, updateCurrUser, removeCurrUser };
export { displayCurrUser };
