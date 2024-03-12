import * as api from "/js/api.js";
import * as chat from "/js/chat/chat.js";
import * as friends from "/js/account/friends.js";
import { getCurrUser } from "/js/user/currUser.js";
import * as router from "/js/router/router.js";
import * as util from "/js/util.js";

var users = {};

// -- singletons ----
async function getUser(id) {
    let key = "user-" + id;
    if (key in users) {
        return users[key];
    }
    await api.fetchRoute({
        route: `/api/user/${id}/`,
        dataManager: user => {
            setUser(id, user);
        },
    });
    return users[key];
}

function setUser(id, user) {
    let key = "user-" + id;
    users[key] = {
        username: user.username,
        image: user.image,
        status: user.status,
    };
}

function removeUser(id) {
    let key = "user-" + id;
    delete users[key];
}

// -- display ----
async function displayUser({
        userId,
        blocked=false,
        friendshipId=undefined,
        friendRequestable=false,
        includeBlockButton=true,
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
        const imgdiv = document.createElement("div");
        imgdiv.classList.add('user-img-container');
        imgdiv.appendChild(img);
        div1.appendChild(imgdiv);

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

        div.appendChild(div2);
    };
    let user = await getUser(userId);
    createElements(user);
    return div;
}

// -- buttons ----
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


export { getUser, setUser, removeUser, unfriend, displayUser };
export { block };
