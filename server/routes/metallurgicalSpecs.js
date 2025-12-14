import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.get('/', verifyToken, asyncErrorHandler(async(req, res, next)=>{
    const response = await Client.query(
        `SELECT * FROM metallurgical_specifications`
    )
    console.log(response[0]);
    res.status(200).json({success:true, data:response[0]});
}))

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, chemical_composition, microstructure } = req.body;

    if (!trial_id || !chemical_composition || !microstructure) {
        throw new CustomError("All metallurgical specs are needed.");
    }

    const chemicalJSON = JSON.stringify(chemical_composition);
    const microJSON = JSON.stringify(microstructure);

    const response = await Client.query(
        `INSERT INTO metallurgical_specifications 
         (trial_id, chemical_composition, microstructure)
         VALUES (?, ?, ?)`,
        [trial_id, chemicalJSON, microJSON]
    );
    
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Metallurgical specifications created', `Metallurgical specifications ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);

    const insertId = response[0].insertId;

    res.status(201).json({
        success: true,
        message: "Metallurgical specifications created successfully."
    });
}));

export default router;