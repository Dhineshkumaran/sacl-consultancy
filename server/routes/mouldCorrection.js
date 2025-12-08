import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks } = req.body || {};
    if (!trial_id || !mould_thickness || !compressability || !squeeze_pressure || !mould_hardness || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO mould_correction (trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Mould correction created', `Mould correction ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ mouldCorrectionId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM mould_correction');
    res.status(200).json({ mouldCorrections: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM mould_correction WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ mouldCorrections: rows });
}));

export default router;

// CREATE TABLE mould_correction (
//     correction_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     mould_thickness VARCHAR(30),
//     compressability VARCHAR(30),
//     squeeze_pressure VARCHAR(30),
//     mould_hardness VARCHAR(30),
//     remarks TEXT
// );