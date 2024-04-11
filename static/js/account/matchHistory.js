import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getUser } from "/js/user/user.js";
import { getCurrentLocation } from "/js/router/router.js";
import { getParams } from "/js/router/params.js";
import { sleep } from "/js/util.js";

let lastLoadedGameId = 0;
let stopLoading = false;
let USER_ID;


async function fetchMatchHistory(fromGameId, size) {
    const route = `/api/match-history/${USER_ID}/?from-game-id=${fromGameId}&size=${size}`;
    let games = [];
    await api.fetchRoute({
        route: route,
        dataManager: async data => {
            games = data;
        }
    });
    if (games.length < size) {
        stopLoading = true;
    }
    return games;
}

// Function to render games
async function renderGames(games) {
    const matchHistoryElement = document.getElementById('match-history');
    
    for (const game of games) {
        const winner = await getUser(game.winner);
        const loser = await getUser(game.loser);
        const cssClass = game.winner == USER_ID ? "win" : "loss";
        matchHistoryElement.innerHTML += `<div class="match-history-game ${cssClass}">
            <h5>Winner: <img src=${winner.image} onerror="this.src='/media/default/default.webp';"></img> ${winner.username}</h5>
            <h5>Loser: <img src=${loser.image} onerror="this.src='/media/default/default.webp';"></img> ${loser.username}</h5>
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
    return moreGames.length;
}

// // Event listener for resize and scroll
["resize", "scroll"].forEach(event => {
    window.addEventListener(event, async () => {
        if (getCurrentLocation().endsWith("match-history/") && atBottom() && !stopLoading) {
            await loadMoreGames();
            await sleep(500);
        }
    });
});

function atBottom() {
    return (window.scrollY + window.innerHeight >= document.body.scrollHeight - 1);
}

// Initial load of match history
async function load() {
    USER_ID = getParams().userId || getCurrUser().id;
    const title = document.querySelector("#match-history-page h1");
    title.innerHTML = `${(await getUser(USER_ID)).username}'s match history`;

    lastLoadedGameId = 0;
    let maxPreload = 5;
    stopLoading = false;
    do {
        await loadMoreGames();
    } while (atBottom() && !stopLoading && maxPreload-- > 0);
}

export { load };