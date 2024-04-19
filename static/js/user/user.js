import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import * as nav from "/js/nav.js";
import * as router from "/js/router/router.js";
import * as util from "/js/util.js";
import * as chat from "/js/chat/chat.js";
import * as chatFriends from "/js/chat/friends.js";
import * as messages from "/js/chat/messages.js";

let users = {
    0: {
        username: "server",
        image: "/media/default/default.webp",
        status: "online",
    },
};

// -- singletons ----
async function getUser(id) {
    if (id in users) {
        return users[id];
    }
    await api.fetchRoute({
        route: `/api/user/${id}/`,
        dataManager: user => {
            setUser(id, user);
        },
    });
    if (!(id in users))
        return {id: -1, username: "bozo", image: "/media/default/default.webp"};
    return users[id];
}

function setUser(id, user) {
    users[id] = {
        username: user.username,
        image: user.image,
        status: user.status,
    };
}

function setUserStatus(id, status) {
    if (users[id]) {
        users[id].status = status;
        updateStatusElements(id, status);
        const friendsContainer = document.getElementById("friends-container");
        sortUsersByStatus(friendsContainer);
        if (router.getCurrentLocation() == "/account/friends/")
            friends.refresh();
    }
}

const statusColors = {
    "online": "green",
    "in-game": "blue",
    "offline": "transparent",
}

function updateStatusElements(id, status) {
    const statusElements = document.querySelectorAll(".online-status");
    for (const statusElement of statusElements) {
        if (statusElement.getAttribute("data-user-id") == id) {
            if (status in statusColors)
                statusElement.style.backgroundColor = statusColors[status];
            const userContainer = statusElement.closest(".user");
            userContainer.setAttribute("data-status", status);
            const gameButton = userContainer.querySelector(".start-match");
            if (gameButton) {
                util.display(gameButton, status == "online");
            }
        }
    }
}

function removeUser(id) {
    delete users[id];
}

// -- display ----
async function displayUser({
        userId,
        blocked=false,
        friendshipId=undefined,
        friendRequestable=false,
        includeBlockButton=true,
        includeStatus=true,
        includeGameButton=false,
    }) {
    const div = document.createElement("div");
    const div1 = document.createElement("div");
    const div2 = document.createElement("div");
    const createElements = (user) => {
        div.className = "user";
        div1.classList.add('user-infos');
        div2.classList.add('user-buttons');


        const img = document.createElement("img");
        img.src = user.image;
        img.className = "img-fluid rounded-circle small-image";
        img.onerror = function () {this.src='/media/default/default.webp'};
        
        const imgAnchor = document.createElement("a");
        imgAnchor.setAttribute("href", `/account/stats/${userId}/`);
        imgAnchor.classList.add('user-img-container');
        imgAnchor.appendChild(img);
        div1.appendChild(imgAnchor);

        const username = document.createElement("p");
        username.classList.add("username");
        username.textContent = user.username;
        div1.appendChild(username);
        div.appendChild(div1);
        
        if (friendshipId) {
            const unfriendButton = makeUnfriendButton(friendshipId);
            div2.append(unfriendButton);
        }
        if (friendRequestable) {
            const friendRequestButton = makeFriendRequestButton(userId);
            div2.append(friendRequestButton);
        }
        
        if (includeBlockButton) {
            const blockButton = makeBlockButton(userId, !blocked);
            div2.append(blockButton);
        }
        if (includeGameButton) {
            const gameButton = makeGameButton(userId);
            if (user.status != "online") {
                util.display(gameButton, false);
            }
            div2.append(gameButton);
        }
        if (includeStatus) {
            const statusElement = document.createElement("div");
            statusElement.classList.add("online-status");
            statusElement.setAttribute("data-user-id", userId);
            if (user.status in statusColors) {
                statusElement.style.backgroundColor = statusColors[user.status];
            }
            div1.appendChild(statusElement);
            div.setAttribute("data-status", user.status);
        }
        div.appendChild(div2);
    };
    let user = await getUser(userId);
    createElements(user);
    return div;
}

// -- buttons ----

function makeGameButton(Id) {
    const button = document.createElement("button");
    button.innerText = 'Play';
    button.classList.add('start-match');
    button.setAttribute("data-user-id", Id);
    return button;
}

function makeBlockButton(userId, block) {
    const button = document.createElement("button");
    const text = block ? "Block" : "Unblock";
    button.innerText = text;
    button.classList.add('block-user-button');
    button.setAttribute("data-block", block);
    button.setAttribute("data-user-id", userId);
    return button;
}

function makeFriendRequestButton(userId) {
    const button = document.createElement("button");
    button.innerText = "Send request";
    button.classList.add('make-friend-request-button');
    button.setAttribute("data-user-id", userId);
    return button;
}

function makeUnfriendButton(friendshipId) {
    const button = document.createElement("button");
    button.innerText = "Unfriend";
    button.classList.add('unfriend-button');
    button.setAttribute("data-friendship-id", friendshipId);
    return button;
}

// -- triggers ----
function block(target) {
    const blocking = target.getAttribute("data-block") == "true";
    const method = blocking ? "POST" : "DELETE";
    const userId = target.getAttribute("data-user-id");
    // console.log(blocking ? "" : "un" + "blocking userId:", userId);
    const options = {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: userId }),
    };
    // console.log("route:", "/api/block/", "options:", options);
    api.fetchRoute({
        route: "/api/block/",
        options: options,
        dataManager: (_) => {
            friends.refresh();
            chat.deleteMessage(userId);
            messages.loadMessages(chat.currRoomId);
        }
    });
    if (target.closest('#friends-requests-container')) {
        nav.incrFriendRequestCount(-1);
    }
    const userContainer = target.closest(".user");
    if (userContainer)
        userContainer.remove();
}

function unfriend(target) {
    const friendshipId = target.getAttribute("data-friendship-id");
    const options = { method: "DELETE" };  
    api.fetchRoute({
        route: `/api/friends/${friendshipId}/`,
        options: options,
        dataManager: (_) => {
            friends.refresh();
        }
    })

}

// -- 
function sortUsersByStatus(container) {
    if (!container) {
        return;
    }
    const userDivs = Array.from(container.querySelectorAll('.user'));
    const statusOrder = {
        "online": 0,
        "in-game": 1,
        "offline": 2
    };
    userDivs.sort((a, b) => {
        return statusOrder[a.getAttribute("data-status")] - statusOrder[b.getAttribute("data-status")];
    });
    container.innerHTML = "";
    userDivs.forEach(div => {
        container.appendChild(div)
    });
}

function sortUsersByName(container) {
    if (!container) {
        return;
    }   
    const userDivs = Array.from(container.querySelectorAll('.user'));
    userDivs.sort((a, b) => {
        const nameA = a.querySelector(".username").innerHTML.toLowerCase();
        const nameB = b.querySelector(".username").innerHTML.toLowerCase();
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });
    container.innerHTML = "";
    userDivs.forEach(div => {
        container.appendChild(div)
    });    
}

export { getUser, setUser, setUserStatus, removeUser, unfriend, displayUser };
export { block };
export { sortUsersByStatus, sortUsersByName };
