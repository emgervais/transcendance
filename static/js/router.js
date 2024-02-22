import * as nav from "/static/js/nav.js";
import * as account from "/static/js/account.js";
import { displayUser } from "/static/js/user.js";

const routes = {
    404: {
        template: "/templates/404.html",
        title: "404",
        description: "Page not found",
    },
    "/": {
        template: "/templates/home.html",
        unprotected: true,
    },
    "/register/": {
        function: nav.displayRegister,
        authContainer: true,
        unprotected: true,
    },
    "/login/": {
        function: nav.displayLogin,
        authContainer: true,
        unprotected: true,
    },
    "/pong/": {
        template: "/templates/pong.html",
    },
    "/account/": {
        template: "/templates/account.html",
        function: account.hideAll,
    },
    "/account/friends/": {
        template: "/templates/account.html",
        function: account.displayFriendsPage,
    },
    "/account/update-info/": {
        template: "/templates/account.html",
        function: account.displayInfoPage,
    },
    "/account/stats/": {
        template: "/templates/account.html",
        function: account.displayStatsPage,
    },
};

const route = (href) => {
    window.history.pushState({}, "", href);
    locationHandler();
};

const htmlCache = {};
async function fetchHTMLWithCache(template) {
    let html;
    if (htmlCache[template]) {
        html = htmlCache[template];
    } else {
        const response = await fetch(template);
        html = await response.text();
        htmlCache[template] = html;
    }
    return html;
}

function getCurrentRoute() {
    const location = window.location.pathname;
    if (location.length == 0) {
        location = "/";
    }
    const route = routes[location] || routes["404"];
    return route;
}

const locationHandler = async () => {
    const route = getCurrentRoute();
    if (!route.authContainer) {
        nav.hideAuthContainer();
    }
    if (route.template) {
        const html = await fetchHTMLWithCache(route.template);
        if (!route.containerId) {
            route.containerId = "dynamic-section"
        }
        document.getElementById(route.containerId).innerHTML = html;
        enableScripts(route.containerId);
    }
    if (route.function) {
        route.function();
    }
    displayUser();
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

export { route, locationHandler, getCurrentRoute };