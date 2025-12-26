import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import transporter from '../utils/mailSender.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction } = req.body || {};
    if (!trial_id || !part_name || !pattern_code || !material_grade || !initiated_by || !date_of_sampling || !no_of_moulds || !reason_for_sampling || !current_department_id || !disa || !sample_traceability) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const mouldJson = JSON.stringify(mould_correction);
    const sql = 'INSERT INTO trial_cards (trial_id, part_name, pattern_code, material_grade, initiated_by, date_of_sampling, no_of_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction) VALUES (@trial_id, @part_name, @pattern_code, @material_grade, @initiated_by, @date_of_sampling, @no_of_moulds, @reason_for_sampling, @status, @current_department_id, @disa, @sample_traceability, @mould_correction)';
    const [result] = await Client.query(sql, {
        trial_id,
        part_name,
        pattern_code,
        material_grade,
        initiated_by,
        date_of_sampling,
        no_of_moulds,
        reason_for_sampling,
        status: status || 'CREATED',
        current_department_id,
        disa,
        sample_traceability,
        mould_correction: mouldJson
    });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Trial created',
        remarks: `Trial ${trial_id} created by ${req.user.username} with part name ${part_name}`
    });
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
    const [rows] = await Client.query('SELECT * FROM trial_cards WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
}));

router.get('/id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let part_name = req.query.part_name;
    if (!part_name) {
        return res.status(400).json({ success: false, message: 'part_name query parameter is required' });
    }
    part_name = part_name.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards WHERE part_name = @part_name', { part_name });

    const count = rows[0].count + 1;
    const formattedId = `${part_name}-${count}`;
    res.status(200).json({ success: true, data: formattedId });
}));

router.put('/update-status', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, status } = req.body;
    if (!trial_id || !status) {
        return res.status(400).json({ success: false, message: 'trial_id is required to approve the status' });
    }
    const [result] = await Client.query("UPDATE trial_cards SET status = @status WHERE trial_id = @trial_id", { status, trial_id });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Trial updated',
        remarks: `Trial ${trial_id} updated by ${req.user.username} as ${status}`
    });
    res.status(200).json({ success: true, message: 'Trial status updated successfully.' });
}));

router.put('/update', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const {
        trial_id,
        part_name,
        pattern_code,
        material_grade,
        date_of_sampling,
        no_of_moulds,
        reason_for_sampling,
        disa,
        sample_traceability,
        mould_correction,
        tooling_modification,
        remarks,
        chemical_composition,
        tensile,
        micro_structure,
        hardness
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id is required to update the trial' });
    }

    const mouldJson = mould_correction ? JSON.stringify(mould_correction) : null;
    const chemJson = chemical_composition ? JSON.stringify(chemical_composition) : null;
    const tensileJson = tensile ? JSON.stringify(tensile) : null;
    const microJson = micro_structure ? JSON.stringify(micro_structure) : null;
    const hardnessJson = hardness ? JSON.stringify(hardness) : null;

    const sql = `UPDATE trial_cards SET 
        part_name = COALESCE(@part_name, part_name),
        pattern_code = COALESCE(@pattern_code, pattern_code),
        material_grade = COALESCE(@material_grade, material_grade),
        date_of_sampling = COALESCE(@date_of_sampling, date_of_sampling),
        no_of_moulds = COALESCE(@no_of_moulds, no_of_moulds),
        reason_for_sampling = COALESCE(@reason_for_sampling, reason_for_sampling),
        disa = COALESCE(@disa, disa),
        sample_traceability = COALESCE(@sample_traceability, sample_traceability),
        mould_correction = COALESCE(@mould_correction, mould_correction),
        tooling_modification = COALESCE(@tooling_modification, tooling_modification),
        remarks = COALESCE(@remarks, remarks)
        WHERE trial_id = @trial_id`;

    const [result] = await Client.query(sql, {
        part_name,
        pattern_code,
        material_grade,
        date_of_sampling,
        no_of_moulds,
        reason_for_sampling,
        disa,
        sample_traceability,
        mould_correction: mouldJson,
        tooling_modification,
        remarks,
        trial_id
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Trial updated',
        remarks: `Trial ${trial_id} updated by ${req.user.username}`
    });

    res.status(200).json({ success: true, message: 'Trial updated successfully.' });
}));

export default router;