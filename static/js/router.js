import { routes } from "/js/routes.js";
import { authContainerDisplay } from "/js/nav.js";

document.addEventListener("click", (e) => {
    const { target } = e;
    if (!target.matches("a[href]")) {
        return;
    }
    e.preventDefault();
    route(e);
});

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
    if (route.function)
        route.function();
    if (route.template)
    {
        authContainerDisplay(true);
        const html = await fetch(route.template).then((response) => response.text());
        document.getElementById("dynamic-content").innerHTML = html;
    }
    // document
    //     .querySelector('meta[name="description"]')
    //     .setAttribute("dynamic-content", route.description);
};

window.onpopstate = locationHandler;
window.route = route;
locationHandler();
