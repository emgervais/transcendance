import * as accountInfo from "/js/account/info.js";
import * as auth from "/js/auth.js";
import * as chat from "/js/chat/chat.js";
import * as chatDisplay from "/js/chat/display.js";
import * as friends from "/js/account/friends.js";
import * as notifications from "/js/notifications.js";
import * as match from "/js/pong/match.js";
import * as router from "/js/router/router.js";
import * as user from "/js/user/user.js";

const idFunctions = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    
    "chat-submit": chat.submit,
    "tab-global": chatDisplay.activateGlobalTab,
    "tab-friends": chatDisplay.toggleFriendsList,
    "tab-game": chatDisplay.activateMatchTab,

    "update-info-button": accountInfo.updateInfoButton,

    "search-user-button": friends.searchUser,
    'invite-notification': match.displayInvite,
};

const classFunctions = {
    'make-friend-request-button': friends.makeRequest,
    'friend-request-button': friends.answerRequest,
    'block-user-button': user.block,
    'unfriend-button': user.unfriend,
    'chat-box-toggle': (_) => { chatDisplay.toggleChatBox(); },
    
    'activate-friend-chat': chatDisplay.activateFriendsTab,
    'close-friend-chat': chatDisplay.closeFriendChat,

    'profile-picture-chat': chatDisplay.activateMenu,

    'start-match': match.invite,
    'respond-invite': match.respondInvite,
}

const outsideIdFunctions = {
    "chat-menu": chatDisplay.disableMenu
};


function callIdFunction(target) {
    if (target.id in idFunctions) {
            idFunctions[target.id]();
        return true;
    }
    return false;
}

function callClassFunction(target) {
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
        && !callClassFunction(target)
    ) {
        target = target.parentElement;
    }
}

function callOutsideIdFunction(target) {
    for (let id in outsideIdFunctions) {
        const element = document.getElementById(id);
        if (!element.contains(target)) {
            outsideIdFunctions[id]();
        }
    }
}

function click(event) {
    const { target } = event;

    callOutsideIdFunction(target);
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