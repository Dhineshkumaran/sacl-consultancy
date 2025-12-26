import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, chemical_composition, process_parameters, remarks } = req.body || {};
    if (!trial_id || !chemical_composition || !process_parameters) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO material_correction (trial_id, chemical_composition, process_parameters, remarks) VALUES (@trial_id, @chemical_composition, @process_parameters, @remarks)';
    const chemicalCompositionJson = JSON.stringify(chemical_composition);
    const processParametersJson = JSON.stringify(process_parameters);
    const [result] = await Client.query(sql, { trial_id, chemical_composition: chemicalCompositionJson, process_parameters: processParametersJson, remarks });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Material correction created',
        remarks: `Material correction ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
    });
    res.status(201).json({
        success: true,
        message: "Material correction created successfully."
    });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, chemical_composition, process_parameters, remarks } = req.body || {};
    if (!trial_id || !chemical_composition || !process_parameters) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'UPDATE material_correction SET chemical_composition = @chemical_composition, process_parameters = @process_parameters, remarks = @remarks WHERE trial_id = @trial_id';
    const chemicalCompositionJson = JSON.stringify(chemical_composition);
    const processParametersJson = JSON.stringify(process_parameters);
    const [result] = await Client.query(sql, { chemical_composition: chemicalCompositionJson, process_parameters: processParametersJson, remarks, trial_id });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Material correction updated',
        remarks: `Material correction ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
    });
    res.status(201).json({
        success: true,
        message: "Material correction updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM material_correction');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM material_correction WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
}));

export default router;