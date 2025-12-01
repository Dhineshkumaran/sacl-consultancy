import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.get('/', asyncErrorHandler(async(req, res, next)=>{
    const response = await Client.query(
        `SELECT * FROM metallurgical_specs`
    )
    console.log(response[0]);
    res.status(200).json(response[0]);
}))

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, chemical_composition, microstructure } = req.body;

    if (!trial_id || !chemical_composition || !microstructure) {
        throw new CustomError("All metallurgical specs are needed.");
    }

    const chemicalJSON = JSON.stringify(chemical_composition);
    const microJSON = JSON.stringify(microstructure);

    const response = await Client.query(
        `INSERT INTO metallurgical_specifications_final 
         (trial_id, chemical_composition, microstructure)
         VALUES (?, ?, ?)`,
        [trial_id, chemicalJSON, microJSON]
    );

    const insertId = response[0].insertId;

    res.status(201).json({
        message: "Metallurgical specifications created successfully.",
        id: insertId
    });
}));

export default router;