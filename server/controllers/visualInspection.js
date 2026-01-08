import Client from '../config/connection.js';

import { updateDepartment, updateRole } from '../services/departmentProgress.js';

export const createInspection = async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks } = req.body || {};
    if (!trial_id || !inspections || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO visual_inspection (trial_id, inspections, visual_ok, remarks) VALUES (@trial_id, @inspections, @visual_ok, @remarks)';
        await trx.query(sql, { trial_id, inspections: inspectionsJson, visual_ok, remarks });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Visual inspection created',
            remarks: `Visual inspection ${trial_id} created by ${req.user.username}`
        });
        await updateRole(trial_id, req.user, trx);
    });

    res.status(201).json({ success: true, message: 'Visual inspection created successfully.' });
};

export const updateInspection = async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks, is_edit } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const inspectionsJson = inspections ? JSON.stringify(inspections) : null;

    await Client.transaction(async (trx) => {
        if(is_edit){
            const sql = `UPDATE visual_inspection SET 
                inspections = COALESCE(@inspections, inspections),
                visual_ok = COALESCE(@visual_ok, visual_ok),
                remarks = COALESCE(@remarks, remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                inspections: inspectionsJson,
                visual_ok: visual_ok || null,
                remarks: remarks || null,
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
        }
        await updateDepartment(trial_id, req.user, trx);
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
