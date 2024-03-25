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
            container.innerHTML += `Ball hit count: ${stats.ball_hit_count}`;
            container.innerHTML += `Longest exchange: ${stats.longest_exchange}`;

            const gamesCount = stats.win_count + stats.loss_count;
            container.innerHTML += `Games played: ${gamesCount}`;
            container.innerHTML += `Win count: ${stats.win_count}`;
            container.innerHTML += `Loss count: ${stats.loss_count}`;
            const winLossRatio = stats.win_count == 0 ? 0 : stats.win_count / gamesCount;
            container.innerHTML += `Win/Loss ratio: ${Math.round(winLossRatio * 100)}%`;
            
        },
    })
}

export { load };
