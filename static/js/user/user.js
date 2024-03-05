import * as api from "/js/api.js";
import * as chat from "/js/chat/chat.js";
import * as friends from "/js/account/friends.js";
import { getCurrUser } from "/js/user/currUser.js";
import * as router from "/js/router.js";
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
        container,
        userId,
        blocked=false,
        friendshipId=undefined,
        friendRequestable=false
    }) {
    const div = document.createElement("div");
    const appendToContainer = (currUserId, user) => {
        div.className = "user";
        
        const img = document.createElement("img");
        img.src = user.image;
        img.className = "img-fluid rounded-circle small-image";
        div.appendChild(img);

        const username = document.createElement("p");
        username.textContent = user.username;
        div.appendChild(username);
        
        container.appendChild(div);

        if (friendshipId) {
            const unfriendButton = makeUnfriendButton(friendshipId);
            div.append(unfriendButton);
        }
        if (friendRequestable) {
            const friendRequestButton = makeFriendRequestButton(userId);
            div.append(friendRequestButton);
        }

        const blockButton = makeBlockButton(userId, !blocked);
        div.append(blockButton);
    };
    const currUserId = getCurrUser().id;
    let user = await getUser(userId);
    appendToContainer(currUserId, user);
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
    button.innerText = "Request friendship";
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
