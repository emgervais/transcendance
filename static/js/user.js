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
// --
function displayUserImage(image=null) {
    if (!image) {
        image = getUser().image;
    }
    document.querySelectorAll("img.user-img").forEach(element => {
        element.src = image;
    });
}

function displayUserName() {
    let username = getUser().username;
    console.log("displayUserName:", username);
}

function displayUser() {
    displayUserImage();
    displayUserName();
}

export { getUser, setUser, updateUser };
