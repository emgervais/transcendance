function updateNav(connect) {
    var connected = document.querySelectorAll('.connected');
    var notconnected = document.querySelectorAll('.anonymous');
    if(connect) {
        connected.forEach(function(connected) {
            connected.style.display = 'block';
        });
        notconnected.forEach(function(notconnected) {
            notconnected.style.display = 'none';
        });
    }
    else {
        connected.forEach(function(connected) {
            connected.style.display = 'none';
        });
        notconnected.forEach(function(notconnected) {
            notconnected.style.display = 'block';
        });
    }
}

function displayAuthContainer(display="block")
{
    document.querySelector("#authentication-container").style.display = display;
    document.querySelector("#shadow").style.display = display;
}

function hideAuthContainer()
{
    displayAuthContainer("none");
}

function displayLogin()
{
    const loginElement = document.querySelector("#login");
    loginElement.style.display = "flex";
    const registerElement = document.querySelector("#register");
    registerElement.style.display = "none";
    displayAuthContainer();
}

function displayRegister()
{
    const loginElement = document.querySelector("#login");
    loginElement.style.display = "none";
    const registerElement = document.querySelector("#register");
    registerElement.style.display = "flex";
    displayAuthContainer();  
}


// function Show(login, first) {
//     var loginElement = document.getElementById('login');
//     var register = document.getElementById('register');
//     if(first === true) {
//         var overlay = document.getElementById("shadow");
//         var box = document.getElementById("authentification");
//         box.style.display = "flex";
//         overlay.style.display = "flex";
//     }
//     if(login === true) {
//         loginElement.style.display = "flex";
//         register.style.display = "none";
//     }
//     else {
//         register.style.display = "flex";
//         loginElement.style.display = "none";
//     }
// }



export {updateNav, displayLogin, displayRegister, hideAuthContainer};