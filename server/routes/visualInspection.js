import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks } = req.body || {};
    if (!trial_id || !inspections || !visual_ok || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);
    const sql = 'INSERT INTO visual_inspection (trial_id, inspections, visual_ok, remarks) VALUES (?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, inspectionsJson, visual_ok, remarks]);
    res.status(201).json({ visualInspectionId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM visual_inspection');
    res.status(200).json({ visualInspections: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM visual_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ visualInspections: rows });
}));

export default router;

// CREATE TABLE visual_inspection (
//     id SERIAL PRIMARY KEY,
//     trial_id INT REFERENCES trial_cards(trial_id) NOT NULL,
//     inspections JSON[],
//     visual_ok BOOLEAN,
//     remarks TEXT
// );

// inspections [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}]