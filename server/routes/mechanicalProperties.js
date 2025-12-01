import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.get('/', asyncErrorHandler(async(req, res, next)=>{
    const response = await Client.query(
        `SELECT * FROM mechanical_properties_final`
    )
    console.log(response[0]);
    res.status(200).json(response[0]);
}))

router.post('/', asyncErrorHandler(async(req, res, next)=>{
    const {trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi} = req.body;
    console.log(req.body);
    
    if(!trial_id || !tensile_strength || !yield_strength || !elongation || !impact_strength_cold || !impact_strength_room || !hardness_surface || !hardness_core || !x_ray_inspection || !mpi){
        throw new CustomError("All mechanical properties are needed.");
    }
    const response = await Client.query(
        `INSERT INTO mechanical_properties_final 
         (trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [trial_id, tensile_strength, yield_strength, elongation, impact_strength_cold, impact_strength_room, hardness_surface, hardness_core, x_ray_inspection, mpi]
    );

    const insertId = response[0].insertId; 
    res.status(201).json({
        message: "Mechanical properties created successfully.",
        id: insertId
    });
}));

export default router;