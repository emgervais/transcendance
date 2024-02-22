function Show(login, first) {
    var loginElement = document.getElementById('login');
    var register = document.getElementById('register');
    if(first === true) {
        var overlay = document.getElementById("shadow");
        var box = document.getElementById("authentification");
        box.style.display = "flex";
        overlay.style.display = "flex";
    }
    if(login === true) {
        loginElement.style.display = "flex";
        register.style.display = "none";
    }
    else {
        register.style.display = "flex";
        loginElement.style.display = "none";
    }
}