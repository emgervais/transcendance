import * as auth from "/js/auth.js";
import * as chat from "/js/chat.js";
import * as account from "/js/account/account.js";

export const buttons = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    
    "chat-toggle": chat.toggleDisplay,
    "chat-submit-button": chat.submit,

    "update-info-button": account.updateInfoButton,
};
