import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const response = await Client.query(
        `SELECT * FROM mechanical_properties_final`
    )
    console.log(response[0]);
    res.status(200).json(response[0]);
}))

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi } = req.body;
    console.log(req.body);

    if (!trial_id || !tensile_strength || !yield_strength || !elongation || !impact_strength_cold || !impact_strength_room || !hardness_surface || !hardness_core || !x_ray_inspection || !mpi) {
        throw new CustomError("All mechanical properties are needed.");
    }
    const response = await Client.query(
        `INSERT INTO mechanical_properties_final 
         (trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi]
    );

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, action_timestamp, remarks) VALUES (?, ?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Mechanical properties created', `Mechanical properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);

    const insertId = response[0].insertId;
    res.status(201).json({
        message: "Mechanical properties created successfully.",
        id: insertId
    });
}));

export default router;

// CREATE TABLE mechanical_properties_final (
//     prop_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     tensile_strength TEXT,
//     yield_strength TEXT,
//     elongation TEXT,
//     impact_strength_cold TEXT,
//     impact_strength_room TEXT,
//     hardness_surface TEXT,
//     hardness_core TEXT,
//     x_ray_inspection TEXT,
//     mpi TEXT
// );