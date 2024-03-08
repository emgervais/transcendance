import * as account from "/js/account/account.js";
import * as nav from "/js/nav.js";
import * as pong from "/js/pong/pong.js";
import { equipParamRoutes, setParams } from "/js/router/params.js";
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
    "/account/stats/<username>/": {
        template: "/templates/account.html",
    },
});

const route = (href) => {
    window.history.pushState({}, "", href);
    locationHandler();
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
    displayCurrUser();
};

window.onpopstate = locationHandler;
window.route = route;

export { route, locationHandler, getCurrentRoute };