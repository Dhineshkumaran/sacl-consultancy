import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const response = await Client.query(
        `SELECT * FROM mechanical_properties_final`
    )
    console.log(response[0]);
    res.status(200).json({success:true, data:response[0]});
}))

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi } = req.body;
    console.log(req.body);

    const response = await Client.query(
        `INSERT INTO mechanical_properties
         (trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi]
    );

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (?, ?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, trial_id, 'Mechanical properties created', `Mechanical properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);

    res.status(201).json({
        success: true,
        message: "Mechanical properties created successfully.",
    });
}));

export default router;