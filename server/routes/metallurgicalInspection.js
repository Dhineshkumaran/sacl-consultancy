import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, user_name, dates, micro_examination, remarks } = req.body || {};
    if (!trial_id || !user_name || !dates || !micro_examination || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const microExaminationJson = JSON.stringify(micro_examination);
    const sql = 'INSERT INTO metallurgical_inspection (trial_id, user_name, dates, micro_examination, remarks) VALUES (?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, user_name, dates, microExaminationJson, remarks]);
    res.status(201).json({ metallurgicalInspectionId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection');
    res.status(200).json({ metallurgicalInspections: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ metallurgicalInspections: rows });
}));

export default router;

// CREATE TABLE metallurgical_inspection (
//     id SERIAL PRIMARY KEY,
//     trial_id TEXT REFERENCES trial_cards(trial_id) NOT NULL,
//     user_name TEXT,
//     dates DATE,
//     micro_examination JSON[],
//     remarks TEXT
// );

// micro_examination [{"Cavity number": "", "Nodularity": "", "Matrix": "", "Carbide": "", "Inclusion": ""} ]