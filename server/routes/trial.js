import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status } = req.body || {};
    if (!part_name || !pattern_code || !material_grade || !initiated_by || !date_of_sampling || !no_of_moulds || !reason_for_sampling) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO trial_cards (part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status || null]);
    res.status(201).json({ trialId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM trial_cards');
    res.status(200).json({ trials: rows });
}));

router.get('/id', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards');
    const currentYear = new Date().getFullYear()%100;
    const count = rows[0].count + 1;
    const serial = {0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L', 12: 'M', 13: 'N', 14: 'O', 15: 'P', 16: 'Q', 17: 'R', 18: 'S', 19: 'T', 20: 'U', 21: 'V', 22: 'W', 23: 'X', 24: 'Y', 25: 'Z' };
    const quotient = Math.floor((count - 1) / 999);
    const remainder = ((count - 1) % 999) + 1;
    const currentSerial = serial[quotient] || 'TRIAL';
    const formattedId = `FY${currentYear}-${currentSerial}${String(remainder).padStart(3, '0')}`;
    res.status(200).json({ trialId: formattedId });
}));

export default router;

// CREATE TABLE trial_cards (
//     trial_id SERIAL PRIMARY KEY,
//     part_name VARCHAR(100),
//     pattern_code VARCHAR(50),    
//     material_grade VARCHAR(50),
//     initiated_by VARCHAR(50),
//     date_of_sampling DATE,
//     no_of_moulds INT,
//     reason_for_sampling TEXT,
//     status VARCHAR(30)
// );