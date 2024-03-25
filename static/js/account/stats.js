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
            const userStats = {
                distance: 132,
                exchange: 654,
                win_loss: 32,
                games:    43,
                easy_win: 'francoma',
                least_chat: 'eboyce',
                swear:  3212,
            };//replace by stats
            const statsText = {
                distance: `<h5>Distance traveled (units relative to canvas) (translated to first pong arcade size, *historic fact!* )</h5>`,
                exchange: `<h5>Longest exhange</h5>`,
                win_loss: `<h5>Win / Loss ratio</h5>`,
                games: `<h5>Number of games</h5>`,
                easy_win: `<h5>Most dominated opponent (and vice versa)</h5>`,
                least_chat: `<h5>Friend with least chat exchanges: [fix your relationship (chat with random automatic message)]</h5>`,
                swear: `<h5>Number of swear words said (your number, highest number among all users [button to insult that motherfucker])</h5>`,
            };

            const statsUnit = {
                distance: ' meters',
                exchange: ' bounces',
                win_loss: '%',
                games:    ' games',
                easy_win: '',
                least_chat: '',
                swear:  ' swear words!',
            }
            if(userId !== getCurrUser().id) {
                container.innerHTML = `<h2>${user.username}</h2>`;
                container.innerHTML += `<div class="stats-img-container"><img src="${user.image}" class="img-fluid rounded-circle small-image"></div>`;
            }
            const statsGrid = document.createElement('div');
            statsGrid.classList.add('stats-grid');
            for(const key in statsText) {
                const div = document.createElement('div');
                div.classList.add('stats-grid-element');
                div.innerHTML = statsText[key];
                const stat = document.createElement('h5');
                stat.innerText = userStats[key] + statsUnit[key];//replace userstats by fetched stats
                stat.style.color = '#9181F4';
                div.appendChild(stat);
                statsGrid.appendChild(div);
            }
            container.appendChild(statsGrid);
        },
    })
}

export { load };
