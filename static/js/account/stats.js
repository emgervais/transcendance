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
            stats.distance = (stats.totals.total_exchanges * 0.127).toFixed(2);
            stats.longest_exchange = stats.totals.longest_exchange;
            stats.winRate = stats.win_rate;
            stats.gamesCount = stats.games
            stats.swearCount = stats.swear_count;
            stats.winCount = stats.totals.wins;
            stats.lossCount = stats.totals.losses;
            stats.timePlayed = new Date(1000 * stats.totals.time_played).toISOString().substr(11, 8)
            stats.most_played_opponent = stats.most_played_opponent.opponent + '\n' + stats.most_played_opponent.games;
            const statsText = {
                distance: `<h5>Horizontal distance traveled <br>(The original pong arcade screen measured 5.375 inches)</h5>`,
                longest_exchange: `<h5>Longest exchange</h5>`,
                winRate: `<h5>Win / Loss ratio</h5>`,
                gamesCount: `<h5>Number of games</h5>`,
                swearCount: `<h5>Number of swear words said</h5>`,
                winCount: `<h5>Wins</h5>`,
                lossCount: `<h5>Losses</h5>`,
                timePlayed: `<h5>Time played</h5>`,
                most_played_opponent: `<h5>Most played opponent</h5>`,
            };
            // container.innerHTML += `Ball hit count: ${stats.ball_hit_count}`;

            // const gamesCount = stats.win_count + stats.loss_count;
            // const winLossRatio = stats.win_count == 0 ? 0 : stats.win_count / gamesCount;
            // container.innerHTML += `Win/Loss ratio: ${Math.round(winLossRatio * 100)}%`;
            
            // players hits + players points (premier est moitié) * 
            const statsUnit = {
                distance: ' meters',
                longest_exchange: ' bounces',
                winRate: '%',
                gamesCount:    ' games',
                // easy_win: '',
                swearCount:  ' swear words!',
                winCount: ' wins',
                lossCount: ' losses',
                timePlayed: '',
                most_played_opponent: ' games',
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
        },
    });
    api.fetchRoute({
        route: `/api/match-history/${userId}/`,
        dataManager: async games => {
            console.log("games:", games);
            const matchHistoryElement = document.getElementById('match-history');
            games.forEach(async game => {
                const winner = await getUser(game.winner);
                const loser = await getUser(game.loser);
                
                matchHistoryElement.innerHTML += `<div class="match-history-game">
                    <h5 style="display: inline-block;">Winner: <img style="width:40px;" src=${winner.image}></img></h5>
                    <h5 style="display: inline-block;width: 120px;">${winner.username}</h5>
                    <div style="display: inline-block;width:40px;"></div>
                    <div style="display: inline-block;">${game.score[0]} - ${game.score[1]}</div>
                    <div style="display: inline-block;">${new Date(game.date).toLocaleString()}</div>
                    <div style="display: inline-block;width:40px;"></div>
                    <h5 style="display: inline-block;">Loser: <img style="width:40px;" src=${loser.image}></img></h5>
                    <h5 style="display: inline-block;">${loser.username}</h5>
                </div>`;
            });
        }
    });
    // Detailed game stats Example : 
    // Available Stats: winner, loser, score, date, duration, longest_exchange, total_exchanges
    const gameId = 1;
    api.fetchRoute({
        route: `/api/game/${gameId}/`,
        dataManager: async game => {
            console.log("game:", game);
            const gameElement = document.getElementById('specific-game');
            const winner = await getUser(game.winner);
            const loser = await getUser(game.loser);

            gameElement.innerHTML += `<div class="specific-game">
                <h5 style="display: inline-block;">Winner: <img style="width:40px;" src=${winner.image}></img></h5>
                <h5 style="display: inline-block;width: 120px;">${winner.username}</h5>
                <div style="display: inline-block;width:40px;"></div>
                <div style="display: inline-block;">${game.score[0]} - ${game.score[1]}</div>
                <div style="display: inline-block;">${new Date(game.date).toLocaleString()}</div>
                <div style="display: inline-block;width:40px;"></div>
                <h5 style="display: inline-block;">Loser: <img style="width:40px;" src=${loser.image}></img></h5>
                <h5 style="display: inline-block;">${loser.username}</h5>
                <div style="display: inline-block;width:40px;"></div>
                <h5 style="display: inline-block;">Duration: ${game.duration} seconds</h5>
                <h5 style="display: inline-block;">Longest exchange: ${game.longest_exchange} bounces</h5>
                <h5 style="display: inline-block;">Total exchanges: ${game.total_exchanges} bounces</h5>
            </div>`;
        }
    });
}

export { load };
