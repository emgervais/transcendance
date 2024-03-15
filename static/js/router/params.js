
let params = {};
const paramRegex = /<([^>]+)>/g;

// -- equipParamRoutes ----
function isParamRoute(route) {
    return !!route.match(paramRegex);
}

function routeToRegex(route) {
    const after = '(\\w+)';
    const names = [];
    const replacement = (_, name) => {
        names.push(name);
        return after;
    };
    const regex = new RegExp("^" + route.replace(paramRegex, replacement) + "$");
    return { regex, names };
}

function equipParamRoutes(routes) {
    for (const route in routes) {
        if (isParamRoute(route)) {
            routes[route] = {...routes[route], ...routeToRegex(route)};
        }
    }
    return routes;
}

// -- route ----
function clearParams() {
    params = {};
}

function setParams(route) {
    clearParams();
    const match = window.location.pathname.match(route.regex);
    if (!match) {
        return null;
    }
    route.names.forEach((name, index) => {
        params[name] = match[index + 1];
    });
}

function getParams() {
    return params;
}

export { isParamRoute, equipParamRoutes };
export { clearParams, setParams, getParams };