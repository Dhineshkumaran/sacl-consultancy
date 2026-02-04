import Client from '../config/connection.js';

import { updateDepartment, updateRole, triggerNextDepartment } from '../services/departmentProgress.js';
import logger from '../config/logger.js';

export const createInspection = async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks, ndt_inspection, ndt_inspection_ok, ndt_inspection_remarks, hardness, hardness_ok, hardness_remarks, is_draft } = req.body || {};
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const inspectionsJson = JSON.stringify(inspections);
    const ndtInspectionJson = JSON.stringify(ndt_inspection || []);
    const hardnessJson = JSON.stringify(hardness || []);

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO visual_inspection (trial_id, inspections, visual_ok, remarks, ndt_inspection, ndt_inspection_ok, ndt_inspection_remarks, hardness, hardness_ok, hardness_remarks) VALUES (@trial_id, @inspections, @visual_ok, @remarks, @ndt_inspection, @ndt_inspection_ok, @ndt_inspection_remarks, @hardness, @hardness_ok, @hardness_remarks)';
        await trx.query(sql, {
            trial_id,
            inspections: inspectionsJson,
            visual_ok: visual_ok ?? null,
            remarks,
            ndt_inspection: ndtInspectionJson,
            ndt_inspection_ok: ndt_inspection_ok ?? null,
            ndt_inspection_remarks: ndt_inspection_remarks || null,
            hardness: hardnessJson,
            hardness_ok: hardness_ok ?? null,
            hardness_remarks: hardness_remarks || null
        });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Visual inspection created',
            remarks: `Visual inspection ${trial_id} created by ${req.user.username}`
        });
        if (req.user.role !== 'Admin') {
            if (is_draft) {
                await triggerNextDepartment(trial_id, req.user, trx);
            } else {
                await updateRole(trial_id, req.user, trx);
            }
        }
    });

    logger.info('Visual inspection created', { trial_id, createdBy: req.user.username });
    res.status(201).json({ success: true, message: 'Visual inspection created successfully.' });
};

export const updateInspection = async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks, ndt_inspection, ndt_inspection_ok, ndt_inspection_remarks, hardness, hardness_ok, hardness_remarks, is_edit } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const inspectionsJson = inspections ? JSON.stringify(inspections) : null;
    const ndtInspectionJson = ndt_inspection ? JSON.stringify(ndt_inspection) : null;
    const hardnessJson = hardness ? JSON.stringify(hardness) : null;

    await Client.transaction(async (trx) => {
        if (is_edit) {
            const sql = `UPDATE visual_inspection SET 
                inspections = COALESCE(@inspections, inspections),
                visual_ok = COALESCE(@visual_ok, visual_ok),
                remarks = COALESCE(@remarks, remarks),
                ndt_inspection = COALESCE(@ndt_inspection, ndt_inspection),
                ndt_inspection_ok = COALESCE(@ndt_inspection_ok, ndt_inspection_ok),
                ndt_inspection_remarks = COALESCE(@ndt_inspection_remarks, ndt_inspection_remarks),
                hardness = COALESCE(@hardness, hardness),
                hardness_ok = COALESCE(@hardness_ok, hardness_ok),
                hardness_remarks = COALESCE(@hardness_remarks, hardness_remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                inspections: inspectionsJson,
                visual_ok: visual_ok ?? null,
                remarks: remarks || null,
                ndt_inspection: ndtInspectionJson,
                ndt_inspection_ok: ndt_inspection_ok ?? null,
                ndt_inspection_remarks: ndt_inspection_remarks || null,
                hardness: hardnessJson,
                hardness_ok: hardness_ok ?? null,
                hardness_remarks: hardness_remarks || null,
                trial_id
            });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Visual inspection updated',
                remarks: `Visual inspection ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
            });
            logger.info('Visual inspection updated', { trial_id, updatedBy: req.user.username });
        }
        if (req.user.role !== 'Admin') {
            if (req.body.is_draft) {
                await triggerNextDepartment(trial_id, req.user, trx);
            } else if (req.user.role === 'User') {
                await updateRole(trial_id, req.user, trx);
            } else {
                await updateDepartment(trial_id, req.user, trx);
            }
        }
    });

    res.status(201).json({
        success: true,
        message: "Visual inspection updated successfully."
    });
};

export const getInspections = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM visual_inspection');
    res.status(200).json({ success: true, data: rows });
};

export const getInspectionByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM visual_inspection WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};
