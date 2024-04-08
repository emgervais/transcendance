import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";

let lastLoadedGameId = 0;

function atBottom() {
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 1)
        return true;
    return false;
}

async function fetchMatchHistory(fromGameId, size) {
    const userId = getCurrUser().id;
    const route = `/api/match-history/${userId}/?from-game-id=${fromGameId}&size=${size}`;
    
    let games = [];
    await api.fetchRoute({
        route: route,
        dataManager: async data => {
            games = data;
        }
    });
    return games;
}

// Function to render games
async function renderGames(games) {
    const matchHistoryElement = document.getElementById('match-history');
    
    for (const game of games) {
        const winner = await getUser(game.winner);
        const loser = await getUser(game.loser);
        
        matchHistoryElement.innerHTML += `<div class="match-history-game">
            <h5>Winner: <img src=${winner.image}></img> ${winner.username}</h5>
            <h5>Loser: <img src=${loser.image}></img> ${loser.username}</h5>
            <p>Score: ${game.score[0]} - ${game.score[1]}</p>
            <p>Date: ${new Date(game.date).toLocaleString()}</p>
            <p>Duration: ${game.duration} seconds</p>
            <p>Longest Exchange: ${game.longest_exchange}</p>
            <p>Ball Hits: ${game.total_hits}</p>
            <p>Distance Travelled: ${game.total_distance} cm</p>
        </div>`;
    }
}

// Function to load more games when user reaches bottom of page
async function loadMoreGames() {
    const size = 5;
    const moreGames = await fetchMatchHistory(lastLoadedGameId, size);
    
    if (moreGames.length > 0) {
        lastLoadedGameId = moreGames[moreGames.length - 1].id;
        await renderGames(moreGames);
    }
}

// Event listener for scroll event
window.addEventListener("scroll", async () => {
    if (atBottom()) {
        await loadMoreGames();
    }
});

// Initial load of match history
async function load() {
    lastLoadedGameId = 0;
    do {
        await loadMoreGames();
    } while (atBottom());
}

export { load };