import Client from '../config/connection.js';

import { updateDepartment, updateRole } from '../services/departmentProgress.js';

export const createInspection = async (req, res, next) => {
    const { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks } = req.body || {};
    if (!trial_id || !inspection_date || !casting_weight || !bunch_weight || !no_of_cavities || !yields || !inspections || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO dimensional_inspection (trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks) VALUES (@trial_id, @inspection_date, @casting_weight, @bunch_weight, @no_of_cavities, @yields, @inspections, @remarks)';
        await trx.query(sql, { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Dimensional inspection created',
            remarks: `Dimensional inspection ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
        });
        await updateRole(trial_id, req.user, trx);
    });

    res.status(201).json({
        message: "Dimensional inspection created successfully.",
        success: true
    });
};

export const updateInspection = async (req, res, next) => {
    const { trial_id, inspection_date, casting_weight, bunch_weight, no_of_cavities, yields, inspections, remarks, is_edit } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const inspectionsJson = inspections ? JSON.stringify(inspections) : null;

    await Client.transaction(async (trx) => {
        if(is_edit){
            const sql = `UPDATE dimensional_inspection SET 
                inspection_date = COALESCE(@inspection_date, inspection_date),
                casting_weight = COALESCE(@casting_weight, casting_weight),
                bunch_weight = COALESCE(@bunch_weight, bunch_weight),
                no_of_cavities = COALESCE(@no_of_cavities, no_of_cavities),
                yields = COALESCE(@yields, yields),
                inspections = COALESCE(@inspections, inspections),
                remarks = COALESCE(@remarks, remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                trial_id,
                inspection_date: inspection_date || null,
                casting_weight: casting_weight || null,
                bunch_weight: bunch_weight || null,
                no_of_cavities: no_of_cavities || null,
                yields: yields || null,
                inspections: inspectionsJson,
                remarks: remarks || null
            });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Dimensional inspection updated',
                remarks: `Dimensional inspection ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
            });
        }
        await updateDepartment(trial_id, req.user, trx);
    });

    res.status(201).json({
        message: "Dimensional inspection updated successfully.",
        success: true
    });
};

export const getInspections = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM dimensional_inspection');
    res.status(200).json({
        success: true,
        data: rows
    });
};

export const getInspectionByTrialId = async (req, res, next) => {
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
};
