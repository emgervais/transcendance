import * as account from "/js/account/account.js";
import * as nav from "/js/nav.js";
import * as pong from "/js/pong/pong.js";
import * as util from "/js/util.js";
import { upgradeParamRoutes, clearParams, setParams } from "/js/router/params.js";
import { displayCurrUser } from "/js/user/currUser.js";

const routes = upgradeParamRoutes({
    404: {
        template: "/templates/404.html",
        title: "404",
        description: "Page not found",
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
    "/": {
        template: "/templates/pong.html",
        onLoad: pong.start,
        onQuit: pong.stop,
        unprotected: true,
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
    "/account/match-history/": {
        template: "/templates/account.html",
        onLoad: account.displayMatchHistoryPage,
    },
    "/account/match-history/<userId>/": {
        template: "/templates/account.html",
        onLoad: account.displayMatchHistoryPage,
    },
});

const routeQuitFunctions = [
    util.clearFloatingBoxes,
]

const routeLoadFunctions = [
    displayCurrUser,
    util.displayState,
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

function getCurrentLocation() {
    const location = window.location.pathname;
    if (location.length == 0) {
        location = "/";
    }
    return location;
}

let prevRoute;
function getCurrentRoute() {
    const location = getCurrentLocation();
    clearParams();
    if (location in routes) {
        return routes[location];
    }
    for (let route in routes) {
        if (!routes[route].regex)
            continue;
        if (location.match(routes[route].regex)) {
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
        let containerId = route.containerId;
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

export { route, locationHandler, getCurrentLocation, getCurrentRoute };