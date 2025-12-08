import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks } = req.body || {};
    if (!trial_id || !inspection_date || !casting_weight || !bunch_weight || !no_of_cavities || !yields || !inspections || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO dimensional_inspection (trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Dimensional inspection created', `Dimensional inspection ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    const insertId = result.insertId;
    res.status(201).json({
        message: "Dimensional inspection created successfully.",
        success: true,
        id: insertId
    });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM dimensional_inspection');
    res.status(200).json({
        success: true,
        inspections: rows
    });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM dimensional_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({
        success: true,
        inspections: rows
    });
}));

export default router;

// CREATE TABLE dimensional_inspection (
//     inspection_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     inspection_date DATE,
//     casting_weight INT,
//     bunch_weight INT,
//     no_of_cavities INT,
//     yields INT,
//     inspections JSON[]
//     remarks TEXT
// );

// inspections [{"Cavity Number": "", "Casting Weight": ""}]