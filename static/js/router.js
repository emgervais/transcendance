import * as nav from "/js/nav.js";
import * as chat from "/js/chat.js";

const routes = {
    404: {
        template: "/templates/404.html",
        title: "404",
        description: "Page not found",
    },
    "/": {
        template: "/templates/home.html",
    },
    "/pong/": {
        template: "/templates/pong.html",
    },
    "/register/": {
        function: nav.displayRegister,
    },
    "/login/": {
        function: nav.displayLogin,
    },
};

const route = (event) => {
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
    locationHandler();
};

const locationHandler = async () => {
    const location = window.location.pathname;
    if (location.length == 0) {
        location = "/";
    }
    const route = routes[location] || routes["404"];
    if (route.template)
    {
        nav.hideAuthContainer();
        const html = await fetch(route.template).then((response) => response.text());
        document.getElementById("dynamic-content").innerHTML = html;
        enableScripts("dynamic-content");
    }
    if (route.function)
        route.function();
};

function enableScripts(elementId) {
    const scriptTags = document.getElementById(elementId).querySelectorAll("script");
    scriptTags.forEach((script) => {
        const newScript = document.createElement("script");
        newScript.src = script.src;
        document.body.appendChild(newScript);
    });
}

window.onpopstate = locationHandler;
window.route = route;
locationHandler();

export { route };