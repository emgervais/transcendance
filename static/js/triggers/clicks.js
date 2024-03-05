import * as account from "/js/account/account.js";
import * as auth from "/js/auth.js";
import * as chat from "/js/chat/chat.js";
import * as chatTriggers from "/js/chat/triggers.js";
import * as friends from "/js/account/friends.js";
import * as router from "/js/router.js";
import * as user from "/js/user/user.js";
import * as util from "/js/util.js";

const idFunctions = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    
    "chat-submit": chat.submit,
    "tab-global": chatTriggers.activateGlobalTab,
    "tab-friends": chatTriggers.toggleFriendsList,
    "tab-game": chatTriggers.activateGameTab,

    "update-info-button": account.updateInfoButton,

    "search-user-button": friends.searchUser,
};

const classFunctions = {
    'make-friend-request-button': friends.makeRequest,
    'friend-request-button': friends.answerRequest,
    'block-user-button': user.block,
    'unfriend-button': user.unfriend,
    'chat-box-toggle': (_) => { chatTriggers.toggleChatBox(); },
    
    'activate-friend-chat': chatTriggers.activateFriendsTab,
    'close-friend-chat': chatTriggers.closeFriendChat,

    'profile-picture-chat': chatTriggers.activateMenu,
}

function callIdFunction(target) {
    if (target.id in idFunctions) {
            idFunctions[target.id]();
        return true;
    }
    return false;
}

function callClassFunctions(target) {
    for (const className of target.classList) {
        if (className in classFunctions) {
            classFunctions[className](target);
            return true;
        }
    }
    return false;
}

function callTargetFunction(target) {
    while (
        target
        && !callIdFunction(target)
        && !callClassFunctions(target)
    ) {
        target = target.parentElement;
    }
}

function click(event) {
    const { target } = event;

    const closestAnchor = target.closest("a[href]");
    if (closestAnchor) {
        event.preventDefault();
        const href = closestAnchor.getAttribute("href");
        router.route(href);        
    } else {
        callTargetFunction(target);
    }
}

export { click };