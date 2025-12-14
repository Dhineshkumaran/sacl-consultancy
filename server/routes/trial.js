import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import transporter from '../utils/mailSender.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction } = req.body || {};
    if (!trial_id || !part_name || !pattern_code || !material_grade || !initiated_by || !date_of_sampling || !no_of_moulds || !reason_for_sampling, !current_department_id, !disa, !sample_traceability) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const mouldJson = JSON.stringify(mould_correction);
    const sql = 'INSERT INTO trial_cards (trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status || null, current_department_id, disa, sample_traceability, mouldJson]);
    // const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    // const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Trial created', `Trial ${trial_id} created by ${req.user.username} with part name ${part_name}`]);
    res.status(201).json({ success: true, message: 'Trial created successfully.' });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM trial_cards');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM trial_cards WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

router.get('/id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let part_name = req.query.part_name;
    if (!part_name) {
        return res.status(400).json({ success: false, message: 'part_name query parameter is required' });
    }
    part_name = part_name.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards WHERE part_name = ?', [part_name]);

    const count = rows[0].count + 1;
    const formattedId = `${part_name}-${count}`;
    res.status(200).json({ success: true, data: formattedId });
}));

export default router;