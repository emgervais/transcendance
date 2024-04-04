import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";
import { getParams } from "/js/router/params.js";


// Python code for reference django/pong/serializers.py

async function load() {
    const userId = getParams().userId || getCurrUser().id;
    api.fetchRoute({
        route: `/api/stats/${userId}/`,
        dataManager: async stats => {
            stats.distance = stats.totals.total_distance;
            stats.longest_exchange = stats.totals.longest_exchange;
            stats.winRate = stats.win_rate;
            stats.gamesCount = stats.games
            stats.swearCount = stats.swear_count;
            stats.winCount = stats.totals.wins;
            stats.lossCount = stats.totals.losses;
            stats.timePlayed = new Date(1000 * stats.totals.time_played).toISOString().substr(11, 8);
            stats.most_played_opponent = stats.most_played_opponent.opponent + '\n' + stats.most_played_opponent.games;
            const statsText = {
                distance: `<h5>Horizontal distance traveled</h5><div class="tooltipp"> <i class="fa-solid fa-circle-info"></i> <p class="tooltiptextt">The original pong arcade screen measured 5.375 inches</p></div>`,
                longest_exchange: `<h5>Longest exchange</h5>`,
                winRate: `<h5>Win / Loss ratio</h5>`,
                gamesCount: `<h5>Number of games</h5>`,
                swearCount: `<h5>Number of swear words said</h5>`,
                winCount: `<h5>Wins</h5>`,
                lossCount: `<h5>Losses</h5>`,
                timePlayed: `<h5>Time played</h5>`,
                most_played_opponent: `<h5>Most played opponent</h5>`,
            };
            const statsUnit = {
                distance: ' cm',
                longest_exchange: ' bounces',
                winRate: '%',
                gamesCount:    ' games',
                swearCount:  ' swear words!',
                winCount: ' wins',
                lossCount: ' losses',
                timePlayed: '',
                most_played_opponent: ' games',
            }
            const statsGrid = document.querySelector('.stats-grid');
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
        },
    });
    api.fetchRoute({
        route: `/api/match-history/${userId}/`,
        dataManager: async games => {
            const matchHistoryElement = document.getElementById('match-history');
            console.log(games);
            games.sort(sortDates);
            console.log(games);
            games.forEach(async game => {
                const winner = await getUser(game.winner);
                const loser = await getUser(game.loser);
                
                matchHistoryElement.innerHTML += `<div class="match-history-game">
                    <h5>Winner: <img src=${winner.image}></img> ${winner.username}</h5>
                    <h5>Loser: <img src=${loser.image}></img> ${loser.username}</h5>
                    <p>Score: ${game.score[0]} - ${game.score[1]}</p>
                    <p>Date: ${new Date(game.date).toLocaleString()}</p>
                </div>`;
            });
        }
    });
}
function sortDates(a, b) {
    return new Date(a.date) - new Date(b.date);
}
export { load };
