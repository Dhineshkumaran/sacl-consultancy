import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks } = req.body || {};
    console.log('req.body:', req.body);

    if (!trial_id || !date || !t_clay || !a_clay || !vcm || !loi || !afs || !gcs || !moi || !compactability || !permeability || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO sand_properties (trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability,remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Sand properties created', `Sand properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Sand properties created successfully.' });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks } = req.body || {};
    if (!trial_id || !date || !t_clay || !a_clay || !vcm || !loi || !afs || !gcs || !moi || !compactability || !permeability || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'UPDATE sand_properties SET date = ?, t_clay = ?, a_clay = ?, vcm = ?, loi = ?, afs = ?, gcs = ?, moi = ?, compactability = ?, permeability = ?, remarks = ? WHERE trial_id = ?';
    const [result] = await Client.query(sql, [date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks, trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Sand properties updated', `Sand properties ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({
        success: true,
        message: "Sand properties updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM sand_properties');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM sand_properties WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;