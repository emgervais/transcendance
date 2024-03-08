import * as api from "/js/api.js";
import { getCurrUser } from "/js/user/currUser.js";
import { getParams } from "/js/router/params.js";

async function load() {
    /*
        search userId using api.fetchRoute
        I need the userId here.
    */

    const userId = getParams().username || getCurrUser().id;
    console.log("userId | username:", userId);
}

export { load };
