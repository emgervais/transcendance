import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";
import { getParams } from "/js/router/params.js";

async function load() {
    const userId = getParams().userId || getCurrUser().id;
    api.fetchRoute({
        route: `/api/stats/${userId}/`,
        dataManager: async stats => {
            const user = await getUser(userId);
            const container = document.getElementById("api-stats");
            container.innerHTML = `User: ${user.username}<br>`;
            container.innerHTML += `<div class="user-img-container"><img src="${user.image}" class="img-fluid rounded-circle small-image"></div>`;

            container.innerHTML += `Swear words said: ${stats.swear_count}`;
            
        },
    })
}

export { load };
