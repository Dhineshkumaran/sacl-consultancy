import Client from '../config/connection.js';

import { updateDepartment, updateRole } from '../services/departmentProgress.js';

export const createPouringDetails = async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks, no_of_mould_poured } = req.body || {};
    if (!trial_id || !pour_date || !heat_code || !composition || !pouring_temp_c || !pouring_time_sec || !inoculation || !other_remarks || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const compositionJson = JSON.stringify(composition);
    const otherRemarksJson = JSON.stringify(other_remarks);
    const inoculationJson = JSON.stringify(inoculation);

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO pouring_details (trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks, no_of_mould_poured) VALUES (@trial_id, @pour_date, @heat_code, @composition, @pouring_temp_c, @pouring_time_sec, @inoculation, @other_remarks, @remarks, @no_of_mould_poured)';
        await trx.query(sql, {
            trial_id,
            pour_date,
            heat_code,
            composition: compositionJson,
            pouring_temp_c,
            pouring_time_sec,
            inoculation: inoculationJson,
            other_remarks: otherRemarksJson,
            remarks,
            no_of_mould_poured
        });

        const updateTrialSql = 'UPDATE trial_cards SET actual_moulds = @actual_moulds WHERE trial_id = @trial_id';
        await trx.query(updateTrialSql, {
            actual_moulds: no_of_mould_poured,
            trial_id
        });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Pouring details created',
            remarks: `Pouring details ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
        });
        await updateRole(trial_id, req.user, trx);
    });

    res.status(201).json({ success: true, message: 'Pouring details created successfully.' });
};

export const updatePouringDetails = async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks, no_of_mould_poured, is_edit } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const compositionJson = composition ? JSON.stringify(composition) : null;
    const otherRemarksJson = other_remarks ? JSON.stringify(other_remarks) : null;
    const inoculationJson = inoculation ? JSON.stringify(inoculation) : null;

    await Client.transaction(async (trx) => {
        if(is_edit){
            const sql = `UPDATE pouring_details SET 
                pour_date = COALESCE(@pour_date, pour_date),
                heat_code = COALESCE(@heat_code, heat_code),
                composition = COALESCE(@composition, composition),
                pouring_temp_c = COALESCE(@pouring_temp_c, pouring_temp_c),
                pouring_time_sec = COALESCE(@pouring_time_sec, pouring_time_sec),
                inoculation = COALESCE(@inoculation, inoculation),
                other_remarks = COALESCE(@other_remarks, other_remarks),
                remarks = COALESCE(@remarks, remarks),
                no_of_mould_poured = COALESCE(@no_of_mould_poured, no_of_mould_poured)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                pour_date: pour_date || null,
                heat_code: heat_code || null,
                composition: compositionJson,
                pouring_temp_c: pouring_temp_c || null,
                pouring_time_sec: pouring_time_sec || null,
                inoculation: inoculationJson,
                other_remarks: otherRemarksJson,
                remarks: remarks || null,
                no_of_mould_poured: no_of_mould_poured || null,
                trial_id
            });

            if (no_of_mould_poured) {
                const updateTrialSql = 'UPDATE trial_cards SET actual_moulds = @actual_moulds WHERE trial_id = @trial_id';
                await trx.query(updateTrialSql, {
                    actual_moulds: no_of_mould_poured,
                    trial_id
                });
            }

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Pouring details updated',
                remarks: `Pouring details ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
            });
        }
        await updateDepartment(trial_id, req.user, trx);
    });

    res.status(201).json({
        success: true,
        message: "Pouring details updated successfully."
    });
};

export const getPouringDetails = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM pouring_details');
    res.status(200).json({ success: true, data: rows });
};

export const getPouringDetailsByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM pouring_details WHERE trial_id = @trial_id', { trial_id });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Pouring details fetched',
        remarks: `Pouring details ${trial_id} fetched by ${req.user.username}`
    });
    res.status(200).json({ success: true, data: rows });
};
