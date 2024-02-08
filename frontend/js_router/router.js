import { routes } from "/js/routes.js";

document.addEventListener("click", (e) => {
    const { target } = e;
    if (!target.matches("nav a")) {
        return;
    }
    e.preventDefault();
    route(e);
});

const route = (event) => {
    event.preventDefault();
    //                       state, unused, target_link
    window.history.pushState({}, "", event.target.href);
    locationHandler();
};

const locationHandler = async () => {
    const location = window.location.pathname;
    if (location.length == 0) {
        location = "/";
    }
    const route = routes[location] || routes["404"];
    const html = await fetch(route.template).then((response) => response.text());
    document.getElementById("content").innerHTML = html;
    document
        .querySelector('meta[name="description"]')
        .setAttribute("content", route.description);
};

window.onpopstate = locationHandler;
window.route = route;
locationHandler();
