// -- singletons ----
function getUser() {
    return JSON.parse(sessionStorage.getItem("user"));
}

function setUser(user) {
    console.log(user);
    sessionStorage.setItem("user", JSON.stringify(user));
}

function updateUser(data=null) {
    if (data) {
        const user = getUser();
        for (const key in data) {
            if (key in user) {
                user[key] = data[key];
            }
        }
        setUser(user);
    }
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
    console.log("displayUserName:", username);
}

function displayUser() {
    let user = getUser();
    if (!user) {
        return;
    }    
    displayUserImage(user.image);
    displayUserName(user.username);
}

export { getUser, setUser, updateUser, removeUser };
