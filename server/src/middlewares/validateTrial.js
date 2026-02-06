import Client from "../config/connection.js";
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';

const validateTrial = asyncErrorHandler(async (req, res, next) => {
    if(req.user.department_id != 1) {
        const { trial_id } = req.body;
        const [trial] = await Client.query(
            `SELECT status FROM trial_cards WHERE trial_id = @trial_id AND deleted_at IS NULL`,
            { trial_id }
        );
        if (!trial || trial.length === 0 || trial[0].status == "CLOSED") {
            throw new CustomError("Trial not found or closed", 404);
        }
        return next();
    }
    return next();
});

export default validateTrial;