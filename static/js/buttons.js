import * as auth from "/js/auth.js";
import * as chat from "/js/chat.js";

export const buttons = {
    "login-button": auth.loginButton,
    "register-button": auth.registerButton,
    "oauth-button": auth.oauthButton,
    "chat-toggle": chat.toggleDisplay,
    "chat-submit-button": chat.submitButton,
};
