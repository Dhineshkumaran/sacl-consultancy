import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const {
        trial_id,
        inspection_date,
        micro_structure,
        micro_structure_ok,
        micro_structure_remarks,
        mech_properties,
        mech_properties_ok,
        mech_properties_remarks,
        impact_strength,
        impact_strength_ok,
        impact_strength_remarks,
        hardness,
        hardness_ok,
        hardness_remarks,
        ndt_inspection,
        ndt_inspection_ok,
        ndt_inspection_remarks
    } = req.body || {};

    if (!trial_id || !inspection_date) {
        return res.status(400).json({ success: false, message: 'Missing required fields: trial_id and inspection_date' });
    }

    const sql = `INSERT INTO metallurgical_inspection (
        trial_id, 
        inspection_date,
        micro_structure,
        micro_structure_ok,
        micro_structure_remarks,
        mech_properties,
        mech_properties_ok,
        mech_properties_remarks,
        impact_strength,
        impact_strength_ok,
        impact_strength_remarks,
        hardness,
        hardness_ok,
        hardness_remarks,
        ndt_inspection,
        ndt_inspection_ok,
        ndt_inspection_remarks
    ) VALUES (
        @trial_id, 
        @inspection_date,
        @micro_structure,
        @micro_structure_ok,
        @micro_structure_remarks,
        @mech_properties,
        @mech_properties_ok,
        @mech_properties_remarks,
        @impact_strength,
        @impact_strength_ok,
        @impact_strength_remarks,
        @hardness,
        @hardness_ok,
        @hardness_remarks,
        @ndt_inspection,
        @ndt_inspection_ok,
        @ndt_inspection_remarks
    )`;

    const [result] = await Client.query(sql, {
        trial_id,
        inspection_date,
        micro_structure: JSON.stringify(micro_structure || []),
        micro_structure_ok,
        micro_structure_remarks: micro_structure_remarks || null,
        mech_properties: JSON.stringify(mech_properties || []),
        mech_properties_ok,
        mech_properties_remarks: mech_properties_remarks || null,
        impact_strength: JSON.stringify(impact_strength || []),
        impact_strength_ok,
        impact_strength_remarks: impact_strength_remarks || null,
        hardness: JSON.stringify(hardness || []),
        hardness_ok,
        hardness_remarks: hardness_remarks || null,
        ndt_inspection: JSON.stringify(ndt_inspection || []),
        ndt_inspection_ok,
        ndt_inspection_remarks: ndt_inspection_remarks || null
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Metallurgical inspection created',
        remarks: `Metallurgical inspection for trial ${trial_id} created by ${req.user.username}`
    });

    res.status(201).json({ success: true, message: 'Metallurgical inspection created successfully.' });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const {
        trial_id,
        inspection_date,
        micro_structure,
        micro_structure_ok,
        micro_structure_remarks,
        mech_properties,
        mech_properties_ok,
        mech_properties_remarks,
        impact_strength,
        impact_strength_ok,
        impact_strength_remarks,
        hardness,
        hardness_ok,
        hardness_remarks,
        ndt_inspection,
        ndt_inspection_ok,
        ndt_inspection_remarks
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Missing required field: trial_id' });
    }

    const sql = `UPDATE metallurgical_inspection SET 
        inspection_date = @inspection_date,
        micro_structure = @micro_structure,
        micro_structure_ok = @micro_structure_ok,
        micro_structure_remarks = @micro_structure_remarks,
        mech_properties = @mech_properties,
        mech_properties_ok = @mech_properties_ok,
        mech_properties_remarks = @mech_properties_remarks,
        impact_strength = @impact_strength,
        impact_strength_ok = @impact_strength_ok,
        impact_strength_remarks = @impact_strength_remarks,
        hardness = @hardness,
        hardness_ok = @hardness_ok,
        hardness_remarks = @hardness_remarks,
        ndt_inspection = @ndt_inspection,
        ndt_inspection_ok = @ndt_inspection_ok,
        ndt_inspection_remarks = @ndt_inspection_remarks
    WHERE trial_id = @trial_id`;

    const [result] = await Client.query(sql, {
        inspection_date,
        micro_structure: JSON.stringify(micro_structure || []),
        micro_structure_ok,
        micro_structure_remarks: micro_structure_remarks || null,
        mech_properties: JSON.stringify(mech_properties || []),
        mech_properties_ok,
        mech_properties_remarks: mech_properties_remarks || null,
        impact_strength: JSON.stringify(impact_strength || []),
        impact_strength_ok,
        impact_strength_remarks: impact_strength_remarks || null,
        hardness: JSON.stringify(hardness || []),
        hardness_ok,
        hardness_remarks: hardness_remarks || null,
        ndt_inspection: JSON.stringify(ndt_inspection || []),
        ndt_inspection_ok,
        ndt_inspection_remarks: ndt_inspection_remarks || null,
        trial_id
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Metallurgical inspection updated',
        remarks: `Metallurgical inspection for trial ${trial_id} updated by ${req.user.username}`
    });

    res.status(200).json({
        success: true,
        message: "Metallurgical inspection updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE metallurgical_inspection (
//     trial_id VARCHAR(255) PRIMARY KEY REFERENCES trial_cards(trial_id),
//     inspection_date DATE,
//     micro_structure JSON,
//     micro_structure_ok BOOLEAN,
//     micro_structure_remarks TEXT,
//     mech_properties JSON,
// 	mech_properties_ok BOOLEAN,
//     mech_properties_remarks TEXT,
//     impact_strength JSON,
// 	impact_strength_ok BOOLEAN,
//     impact_strength_remarks TEXT,
//     hardness JSON,
// 	hardness_ok BOOLEAN,
//     hardness_remarks TEXT,
//     ndt_inspection JSON,
// 	ndt_inspection_ok BOOLEAN,
//     ndt_inspection_remarks TEXT
// );