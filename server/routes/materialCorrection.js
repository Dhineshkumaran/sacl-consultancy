import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, chemical_composition, process_parameters } = req.body || {};
    if (!trial_id || !chemical_composition || !process_parameters) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO material_correction (trial_id, chemical_composition, process_parameters) VALUES (?, ?, ?)';
    const chemicalCompositionJson = JSON.stringify(chemical_composition);
    const processParametersJson = JSON.stringify(process_parameters);
    const [result] = await Client.query(sql, [trial_id, chemicalCompositionJson, processParametersJson]);
    res.status(201).json({ materialCorrectionId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM material_correction');
    res.status(200).json({ materialCorrections: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM material_correction WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ materialCorrections: rows });
}));

// CREATE TABLE material_correction (
//     id SERIAL PRIMARY KEY,
//     trial_id INT REFERENCES trial_cards(trial_id) NOT NULL,
//     chemical_composition JSON,
//     process_parameters JSON
// );

// {
//     "chemical_composition": {
//         "c_percent": "",
//         "si_percent": "",
//         "mn_percent": "",
//         "p_percent": "",
//         "s_percent": "",
//         "mg_percent": "",
//         "cu_percent": "",
//         "cr_percent": ""
//     },
//     "process_parameters": {
//         "pouring_temp_c": "",
//         "inoculant_per_sec": "",
//         "inoculant_type": ""
//     }
// }