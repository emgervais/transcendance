import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";

async function load() {
    const userId = getCurrUser().id;
    console.log("userId:", userId);
    api.fetchRoute({
        route: `/api/match-history/${userId}/`,
        dataManager: async games => {
            const matchHistoryElement = document.getElementById('match-history');
            console.log("matchHistoryElement:", matchHistoryElement);
            games.sort(sortDates);
            // games.forEach(async game => {
            for (const game of games) {
                const winner = await getUser(game.winner);
                const loser = await getUser(game.loser);
                
                matchHistoryElement.innerHTML += `<div class="match-history-game">
                    <h5>Winner: <img src=${winner.image}></img> ${winner.username}</h5>
                    <h5>Loser: <img src=${loser.image}></img> ${loser.username}</h5>
                    <p>Score: ${game.score[0]} - ${game.score[1]}</p>
                    <p>Date: ${new Date(game.date).toLocaleString()}</p>
                </div>`;
            }
            // });
        }
    });
}

function sortDates(a, b) {
    console.log("a.date:", a.date, "new Date(a.date):", new Date(a.date));
    return new Date(a.date) - new Date(b.date);
}

export { load };
