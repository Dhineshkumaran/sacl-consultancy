import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks } = req.body || {};
    console.log('req.body:', req.body);
    if (!trial_id || !pour_date || !heat_code || !composition || !pouring_temp_c || !pouring_time_sec || !inoculation || !other_remarks || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const compositionJson = JSON.stringify(composition);
    const otherRemarksJson = JSON.stringify(other_remarks);
    const inoculationJson = JSON.stringify(inoculation);
    const sql = 'INSERT INTO pouring_details (trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, pour_date, heat_code, compositionJson, pouring_temp_c, pouring_time_sec, inoculationJson, otherRemarksJson, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details created', `Pouring details ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Pouring details created successfully.' });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks } = req.body || {};
    if (!trial_id || !pour_date || !heat_code || !composition || !pouring_temp_c || !pouring_time_sec || !inoculation || !other_remarks || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const compositionJson = JSON.stringify(composition);
    const otherRemarksJson = JSON.stringify(other_remarks);
    const inoculationJson = JSON.stringify(inoculation);
    const sql = 'UPDATE pouring_details SET pour_date = ?, heat_code = ?, composition = ?, pouring_temp_c = ?, pouring_time_sec = ?, inoculation = ?, other_remarks = ?, remarks = ? WHERE trial_id = ?';
    const [result] = await Client.query(sql, [pour_date, heat_code, compositionJson, pouring_temp_c, pouring_time_sec, inoculationJson, otherRemarksJson, remarks, trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details updated', `Pouring details ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({
        success: true,
        message: "Pouring details updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM pouring_details');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM pouring_details WHERE trial_id = ?', [trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details created', `Pouring details ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;