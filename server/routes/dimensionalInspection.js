import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks } = req.body || {};
    console.log(req.body);
    if (!trial_id || !inspection_date || !casting_weight || !bunch_weight || !no_of_cavities || !yields || !inspections || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO dimensional_inspection (trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks) VALUES (@trial_id, @inspection_date, @casting_weight, @bunch_weight, @no_of_cavities, @yields, @inspections, @remarks)';
    const [result] = await Client.query(sql, { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Dimensional inspection created',
        remarks: `Dimensional inspection ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
    });
    res.status(201).json({
        message: "Dimensional inspection created successfully.",
        success: true
    });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks } = req.body || {};
    console.log(req.body);
    if (!trial_id || !inspection_date || !casting_weight || !bunch_weight || !no_of_cavities || !yields || !inspections || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'UPDATE dimensional_inspection SET inspection_date = @inspection_date, casting_weight = @casting_weight, bunch_weight = @bunch_weight, no_of_cavities = @no_of_cavities, yields = @yields, inspections = @inspections, remarks = @remarks WHERE trial_id = @trial_id';
    const [result] = await Client.query(sql, { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Dimensional inspection updated',
        remarks: `Dimensional inspection ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
    });
    res.status(201).json({
        message: "Dimensional inspection updated successfully.",
        success: true
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM dimensional_inspection');
    res.status(200).json({
        success: true,
        data: rows
    });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT TOP 1 * FROM dimensional_inspection WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({
        success: true,
        data: rows
    });
}));

export default router;