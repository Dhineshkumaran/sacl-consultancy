import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date } = req.body || {};
    console.log(req.body);
    if (!trial_id || !mould_thickness || !compressability || !squeeze_pressure || !mould_hardness || !remarks || !date) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO mould_correction (trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, mould_thickness, compressability, squeeze_pressure, mould_hardness, remarks, date]);
    
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Mould correction created', `Mould correction ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Mould correction created successfully.' });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM mould_correction');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM mould_correction WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;