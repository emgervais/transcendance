import * as util from "/static/js/util.js";

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

function displayAuthContainer()
{
    util.display("authentication-container", "block");
    util.display("shadow", "block");
}

function hideAuthContainer()
{
    util.display("authentication-container", "none");
    util.display("shadow", "none");
}

function displayLogin()
{
    util.display("login", "flex");
    util.display("register", "none");
    displayAuthContainer();
}

function displayRegister()
{
    util.display("login", "none");
    util.display("register", "flex");
    displayAuthContainer();
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