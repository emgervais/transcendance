import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";
import { getParams } from "/js/router/params.js";

async function load() {
    const userId = getParams().userId || getCurrUser().id;
    api.fetchRoute({
        route: `/api/stats/${userId}/`,
        dataManager: async stats => {
            console.log("stats:", stats);
            const user = await getUser(userId);
            const container = document.getElementById("api-stats");
            // const userStats = {
            //     distance: 132,
            //     longest_exchange: 654,
            //     win_loss: 32,
            //     gamesCount:    43,
            //     easy_win: 'francoma',
            //     least_chat: 'eboyce',
            //     swear_count:  3212,
            // };//replace by stats
            stats.gamesCount = stats.win_count + stats.loss_count;
            stats.win_loss = Math.round((stats.win_count == 0 ? 0 : stats.win_count / stats.gamesCount) * 100);
            stats.distance = (stats.ball_travel_length * 0.127).toFixed(2);
            const statsText = {
                distance: `<h5>Horizontal distance traveled <br>(The original pong arcade screen measured 5.375 inches)</h5>`,
                longest_exchange: `<h5>Longest exchange</h5>`,
                win_loss: `<h5>Win / Loss ratio</h5>`,
                gamesCount: `<h5>Number of games</h5>`,
                // easy_win: `<h5>Most dominated opponent (and vice versa)</h5>`,
                swear_count: `<h5>Number of swear words said</h5>`,
            };
            // container.innerHTML += `Ball hit count: ${stats.ball_hit_count}`;

            // const gamesCount = stats.win_count + stats.loss_count;
            // const winLossRatio = stats.win_count == 0 ? 0 : stats.win_count / gamesCount;
            // container.innerHTML += `Win/Loss ratio: ${Math.round(winLossRatio * 100)}%`;
            
            // players hits + players points (premier est moitié) * 
            const statsUnit = {
                distance: ' meters',
                longest_exchange: ' bounces',
                win_loss: '%',
                gamesCount:    ' games',
                // easy_win: '',
                swear_count:  ' swear words!',
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
                stat.innerText = stats[key] + statsUnit[key];//replace userstats by fetched stats
                stat.style.color = '#9181F4';
                div.appendChild(stat);
                statsGrid.appendChild(div);
            }
            container.appendChild(statsGrid);
            displayMatchHistory(stats.games);
        },
    })
}

function displayMatchHistory(games) {
    const matchHistoryElement = document.getElementById('match-history');
    games.forEach(game => {
        displayMatch(matchHistoryElement, game);
    });
}

function displayMatch(matchHistoryElement, game) {
    matchHistoryElement.innerHTML += `<div class="match-history-game">
        <h5 style="display: inline-block;">Winner: <img style="width:40px;" src=${game.winner.image}></img></h5>
        <h5 style="display: inline-block;width: 120px;">${game.winner.username}</h5>
        <div style="display: inline-block;width:40px;"></div>
        <div style="display: inline-block;">${game.winner_score} - ${game.loser_score}</div>
        <div style="display: inline-block;width:40px;"></div>
        <h5 style="display: inline-block;">Loser: <img style="width:40px;" src=${game.loser.image}></img></h5>
        <h5 style="display: inline-block;">${game.loser.username}</h5>
    </div>`;
}

export { load };
