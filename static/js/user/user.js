import * as api from "/js/api.js";
import * as friends from "/js/account/friends.js";
import * as util from "/js/util.js";

var users = {};

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
    return users[id];
}

function setUser(id, user) {
    users[id] = {
        username: user.username,
        image: user.image,
        status: user.status == "online",
    };
}

function setUserStatus(id, status) {
    if (users[id]) {
        users[id].status = status;
        const statusElements = document.querySelectorAll(".online-status");
        for (const statusElement of statusElements) {
            if (statusElement.getAttribute("data-user-id") == id) {
                status ? statusElement.style.backgroundColor = 'green' : statusElement.style.backgroundColor = 'transparent';
                const userContainer = statusElement.closest(".user");
                userContainer.setAttribute("data-status", status);
                const gameButton = userContainer.querySelector(".start-match");
                if (gameButton) {
                    util.display(gameButton, status);
                }
            }
        }
        const friendsContainer = document.getElementById("friends-container");
        sortUsers(friendsContainer);
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
        
        const imgAnchor = document.createElement("a");
        imgAnchor.setAttribute("href", `/account/stats/${userId}/`);
        imgAnchor.classList.add('user-img-container');
        imgAnchor.appendChild(img);
        div1.appendChild(imgAnchor);

        const username = document.createElement("p");
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
            if (!user.status) {
                util.display(gameButton, false);
            }
            div2.append(gameButton);
        }
        if (includeStatus) {
            const statusElement = document.createElement("div");
            statusElement.classList.add("online-status");
            statusElement.setAttribute("data-user-id", userId);
            if (user.status) {
                statusElement.style.backgroundColor = 'green';
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
    console.log(blocking ? "" : "un" + "blocking userId:", userId);
    const options = {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: userId }),
    };
    api.fetchRoute({
        route: "/api/block/",
        options: options,
        dataManager: (_) => {
            friends.refresh();
        }
    });
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
function sortUsers(container) {
    if (!container) {
        return;
    }
    const userDivs = Array.from(container.querySelectorAll('.user'));
    userDivs.sort((a, b) => {
        const statusA = a.getAttribute("data-status") === "true";
        const statusB = b.getAttribute("data-status") === "true";
        return statusB - statusA;
    });
    container.innerHTML = "";
    userDivs.forEach(div => {
        container.appendChild(div)
    });
}

export { getUser, setUser, setUserStatus, removeUser, unfriend, displayUser };
export { block };
export { sortUsers };
