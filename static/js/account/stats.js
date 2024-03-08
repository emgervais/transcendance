import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getParams } from "/js/router/params.js";

async function load() {
    const userId = getParams().userId || getCurrUser().id;
    console.log("userId:", userId);
}

export { load };
