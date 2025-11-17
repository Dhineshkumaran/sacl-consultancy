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

router.get('/count', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards');
    res.status(200).json({ count: rows[0].count });
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
