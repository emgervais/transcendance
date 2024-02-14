import * as auth from "/static/js/auth.js";
import * as chat from "/static/js/chat.js";

export const buttons = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "logout-button": auth.logout,
    "oauth-button": auth.oauthButton,
    "chat-toggle": chat.toggleDisplay,
    "chat-submit-button": chat.submitButton,
};
