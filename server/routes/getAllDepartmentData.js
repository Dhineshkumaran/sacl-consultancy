import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();


router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (trial_id) {
        trial_id = trial_id.replace(/['"]+/g, '');
    }
    const [trial_cards] = await Client.query(
        `SELECT * FROM trial_cards WHERE trial_id = ?`,
        [trial_id]
    );

    const [pouring_details] = await Client.query(
        `SELECT * FROM pouring_details WHERE trial_id = ?`,
        [trial_id]
    );
    const [sand_properties] = await Client.query(
        `SELECT * FROM sand_properties WHERE trial_id = ?`,
        [trial_id]
    );
    const [mould_correction] = await Client.query(
        `SELECT * FROM mould_correction WHERE trial_id = ?`,
        [trial_id]
    );
    const [metallurgical_inspection] = await Client.query(
        `SELECT * FROM metallurgical_inspection WHERE trial_id = ?`,
        [trial_id]
    );
    const [visual_inspection] = await Client.query(
        `SELECT * FROM visual_inspection WHERE trial_id = ?`,
        [trial_id]
    );
    const [dimensional_inspection] = await Client.query(
        `SELECT * FROM dimensional_inspection WHERE trial_id = ?`,
        [trial_id]
    );
    const [machine_shop] = await Client.query(
        `SELECT * FROM machine_shop WHERE trial_id = ?`,
        [trial_id]
    );

    res.status(200).json({
        success: true,
        data: {
            trial_cards,
            pouring_details,
            sand_properties,
            mould_correction,
            metallurgical_inspection,
            visual_inspection,
            dimensional_inspection,
            machine_shop
        }
    });
}));

export default router;