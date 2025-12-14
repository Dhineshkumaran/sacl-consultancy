import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks } = req.body || {};
    if (!trial_id || !inspections || !visual_ok || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);
    const sql = 'INSERT INTO visual_inspection (trial_id, inspections, visual_ok, remarks) VALUES (?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, inspectionsJson, visual_ok, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Visual inspection created', `Visual inspection ${trial_id} created by ${req.user.username}`]);
    res.status(201).json({ success: true, message: 'Visual inspection created successfully.' });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks } = req.body || {};
    if (!trial_id || !inspections || !visual_ok || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);
    const sql = 'UPDATE visual_inspection SET inspections = ?, visual_ok = ?, remarks = ? WHERE trial_id = ?';
    const [result] = await Client.query(sql, [inspectionsJson, visual_ok, remarks, trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Visual inspection updated', `Visual inspection ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({
        success: true,
        message: "Visual inspection updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM visual_inspection');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM visual_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;