import { loginDisplay, registerDisplay } from "/js/nav.js";

export const routes = {
    404: {
        template: "/templates/404.html",
        title: "404",
        description: "Page not found",
    },
    "/": {
        template: "/templates/home.html",
    },
    "/chat/": {
        template: "/templates/chat.html",
    },
    "/register/": {
        function: registerDisplay,
    },
    "/login/": {
        function: loginDisplay,
    },
};
