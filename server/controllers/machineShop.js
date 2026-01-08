import Client from '../config/connection.js';

import { approveProgress, updateRole } from '../services/departmentProgress.js';

export const createMachineShop = async (req, res, next) => {
    const { trial_id, inspection_date, inspections, remarks } = req.body || {};
    if (!trial_id || !inspection_date || !inspections) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO machine_shop (trial_id, inspection_date, inspections, remarks) VALUES (@trial_id, @inspection_date, @inspections, @remarks)';
        await trx.query(sql, { trial_id, inspection_date, inspections: inspectionsJson, remarks });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Machine shop created',
            remarks: `Machine shop ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
        });        
        await updateRole(trial_id, req.user, trx);
    });

    res.status(201).json({
        success: true,
        message: "Machine shop created successfully."
    });
};

export const updateMachineShop = async (req, res, next) => {
    const { trial_id, inspection_date, inspections, remarks, is_edit } = req.body || {};
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }
    const inspectionsJson = inspections ? JSON.stringify(inspections) : null;

    await Client.transaction(async (trx) => {
        if(is_edit){
            const sql = 'UPDATE machine_shop SET inspection_date = COALESCE(@inspection_date, inspection_date), inspections = COALESCE(@inspections, inspections), remarks = COALESCE(@remarks, remarks) WHERE trial_id = @trial_id';
            await trx.query(sql, { inspection_date, inspections: inspectionsJson, remarks, trial_id });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Machine shop updated',
                remarks: `Machine shop ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
            });
        }
        await approveProgress(trial_id, req.user, trx);
    });

    res.status(201).json({
        success: true,
        message: "Machine shop updated successfully."
    });
};

export const getMachineShops = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM machine_shop');
    res.status(200).json({ success: true, data: rows });
};

export const getMachineShopByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM machine_shop WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};
