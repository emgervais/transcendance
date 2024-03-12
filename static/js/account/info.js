import * as api from "/js/api.js";
import { updateCurrUser } from "/js/user/currUser.js";

function updateInfoButton() {
    api.formSubmit({
        formId: "update-info-form",
        callback: updateCurrUser,
        method: "put"
    });
}

export { updateInfoButton };