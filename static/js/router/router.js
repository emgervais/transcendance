import * as account from "/js/account/account.js";
import * as auth from "/js/auth.js";
import * as nav from "/js/nav.js";
import * as pong from "/js/pong/pong.js";
import * as util from "/js/util.js";
import { equipParamRoutes, clearParams, setParams } from "/js/router/params.js";
import { displayCurrUser } from "/js/user/currUser.js";

const routes = equipParamRoutes({
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
        onLoad: nav.displayRegister,
        onQuit: nav.hideAuthContainer,
        authContainer: true,
        unprotected: true,
    },
    "/login/": {
        onLoad: nav.displayLogin,
        onQuit: nav.hideAuthContainer,
        authContainer: true,
        unprotected: true,
    },
    "/pong/": {
        template: "/templates/pong.html",
        onLoad: pong.start,
        onQuit: pong.stop,
    },
    "/account/": {
        template: "/templates/account.html",
        onLoad: account.hideAll,
    },
    "/account/friends/": {
        name: "friends",
        template: "/templates/account.html",
        onLoad: account.displayFriendsPage,
    },
    "/account/update-info/": {
        template: "/templates/account.html",
        onLoad: account.displayInfoPage,
    },
    "/account/stats/": {
        template: "/templates/account.html",
        onLoad: account.displayStatsPage,
    },
    "/account/stats/<userId>/": {
        template: "/templates/account.html",
        onLoad: account.displayStatsPage,
    },
});

const routeQuitFunctions = [
    util.clearFloatingBoxes,
]

const routeLoadFunctions = [
    displayCurrUser,
]

const route = async (href) => {
    window.history.pushState({}, "", href);
    await locationHandler();
};

// -- fetch document ----
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
// --

var prevRoute;
function getCurrentRoute() {
    const location = window.location.pathname;
    if (location.length == 0) {
        location = "/";
    }
    clearParams();
    if (location in routes) {
        return routes[location];
    }
    for (let route in routes) {
        if (!routes[route].regex)
            continue;
        if (location.match(route.regex)) {
            setParams(routes[route]);
            return routes[route];
        }
    }
    return routes["404"];
}

const locationHandler = async () => {
    routeQuitFunctions.forEach(f => f());
    if (prevRoute && prevRoute.onQuit) {
        prevRoute.onQuit();
    }
    const route = getCurrentRoute();
    prevRoute = route;
    if (route.template) {
        const html = await fetchHTMLWithCache(route.template);
        var containerId = route.containerId;
        if (!containerId) {
            containerId = "dynamic-section"
        }
        document.getElementById(containerId).innerHTML = html;
    }
    if (route.onLoad) {
        route.onLoad();
    }
    routeLoadFunctions.forEach(f => f());

};

window.onpopstate = locationHandler;
window.route = route;

export { route, locationHandler, getCurrentRoute };