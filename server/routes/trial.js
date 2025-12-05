import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import transporter from '../utils/mailSender.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction } = req.body || {};
    if (!part_name || !pattern_code || !material_grade || !initiated_by || !date_of_sampling || !no_of_moulds || !reason_for_sampling, !current_department_id, !disa, !sample_traceability) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const mouldJson = JSON.stringify(mould_correction);
    const sql = 'INSERT INTO trial_cards (part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status || null, current_department_id, disa, sample_traceability, mouldJson]);
    res.status(201).json({ trialId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM trial_cards');
    res.status(200).json({ trials: rows });
}));

router.get('/id', asyncErrorHandler(async (req, res, next) => {
    let part_name = req.query.part_name;
    if (!part_name) {
        return res.status(400).json({ message: 'part_name query parameter is required' });
    }
    part_name = part_name.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards WHERE part_name = ?', [part_name]);

    const count = rows[0].count + 1;
    const formattedId = `${part_name}-${count}`;
    res.status(200).json({ trialId: formattedId });
}));

router.post('/notify', asyncErrorHandler(async (req, res, next) => {
    const { to, subject, text } = req.body || {};
    if (!to || !subject || !text) {
        return res.status(400).json({ message: 'Missing required fields for sending email' });
    }
    const mailOptions = {
        to,
        subject,
        text
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });
}));

export default router;

// CREATE TABLE trial_cards (
//     trial_id TEXT PRIMARY KEY,
//     part_name VARCHAR(100),
//     pattern_code VARCHAR(50),
//     material_grade VARCHAR(50),
//     initiated_by VARCHAR(50),
//     date_of_sampling DATE,
//     no_of_moulds INT,
//     reason_for_sampling TEXT,
//     status VARCHAR(30),
//     current_department_id INT REFERENCES departments(department_id),
//     disa VARCHAR(50),
//     sample_traceability VARCHAR(50),
//     mould_correction JSON
// );

// [{"compressibility": "", "squeeze_pressure": "", "filler_size": ""}, {"compressibility": "", "squeeze_pressure": "", "filler_size": ""}]