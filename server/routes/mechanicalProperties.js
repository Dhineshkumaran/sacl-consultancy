import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.get('/by-trial', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id } = req.query;
    if (!trial_id) {
        throw new CustomError("Trial id is required.", 400);
    }
    const [rows] = await Client.query(
        `SELECT * FROM mechanical_properties WHERE trial_id = @trial_id`,
        { trial_id }
    )
    if (rows.length === 0) {
        throw new CustomError("No mechanical properties found for the specified trial id.", 404);
    }
    res.status(200).json({ success: true, data: rows[0] });
}))

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi } = req.body;
    console.log(req.body);

    const response = await Client.query(
        `INSERT INTO mechanical_properties
         (trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi)
            VALUES (@trial_id, @tensile_strength, @yield_strength, @elongation, @impact_strength_cold, @impact_strength_room, @hardness_surface, @hardness_core, @x_ray_inspection, @mpi)`,
        {
            trial_id,
            tensile_strength,
            yield_strength,
            elongation,
            impact_strength_cold,
            impact_strength_room,
            hardness_surface,
            hardness_core,
            x_ray_inspection,
            mpi
        }
    );

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Mechanical properties created',
        remarks: `Mechanical properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
    });

    res.status(201).json({
        success: true,
        message: "Mechanical properties created successfully.",
    });
}));

export default router;