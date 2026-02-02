import Client from "../config/db.js";
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';

const validateTrial = asyncErrorHandler(async (req, res, next) => {
    const { trial_id } = req.body;

    const [trial] = await Client.query(
        `SELECT status FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    if (!trial || trial.length === 0 || trial[0].status == "CLOSED") {
        throw new CustomError("Trial not found or closed", 404);
    }
    return next();

});

export default validateTrial;