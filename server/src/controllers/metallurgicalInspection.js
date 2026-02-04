import Client from '../config/connection.js';

import { updateDepartment, updateRole, triggerNextDepartment } from '../services/departmentProgress.js';
import logger from '../config/logger.js';

export const createInspection = async (req, res, next) => {
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
        is_draft
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    await Client.transaction(async (trx) => {
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
            impact_strength_remarks
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
            @impact_strength_remarks
        )`;

        await trx.query(sql, {
            trial_id,
            inspection_date,
            micro_structure: JSON.stringify(micro_structure || []),
            micro_structure_ok: micro_structure_ok ?? null,
            micro_structure_remarks: micro_structure_remarks || null,
            mech_properties: JSON.stringify(mech_properties || []),
            mech_properties_ok: mech_properties_ok ?? null,
            mech_properties_remarks: mech_properties_remarks || null,
            impact_strength: JSON.stringify(impact_strength || []),
            impact_strength_ok: impact_strength_ok ?? null,
            impact_strength_remarks: impact_strength_remarks || null
        });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Metallurgical inspection created',
            remarks: `Metallurgical inspection for trial ${trial_id} created by ${req.user.username}`
        });
        if (req.user.role !== 'Admin') {
            if (is_draft) {
                await triggerNextDepartment(trial_id, req.user, trx);
            } else {
                await updateRole(trial_id, req.user, trx);
            }
        }
    });

    logger.info('Metallurgical inspection created', { trial_id, createdBy: req.user.username });

    res.status(201).json({ success: true, message: 'Metallurgical inspection created successfully.' });
};

export const updateInspection = async (req, res, next) => {
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
        is_edit
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    const microStructureJson = micro_structure ? JSON.stringify(micro_structure) : null;
    const mechPropertiesJson = mech_properties ? JSON.stringify(mech_properties) : null;
    const impactStrengthJson = impact_strength ? JSON.stringify(impact_strength) : null;

    await Client.transaction(async (trx) => {
        if (is_edit) {
            const sql = `UPDATE metallurgical_inspection SET 
            inspection_date = COALESCE(@inspection_date, inspection_date),
            micro_structure = COALESCE(@micro_structure, micro_structure),
            micro_structure_ok = COALESCE(@micro_structure_ok, micro_structure_ok),
            micro_structure_remarks = COALESCE(@micro_structure_remarks, micro_structure_remarks),
            mech_properties = COALESCE(@mech_properties, mech_properties),
            mech_properties_ok = COALESCE(@mech_properties_ok, mech_properties_ok),
            mech_properties_remarks = COALESCE(@mech_properties_remarks, mech_properties_remarks),
            impact_strength = COALESCE(@impact_strength, impact_strength),
            impact_strength_ok = COALESCE(@impact_strength_ok, impact_strength_ok),
            impact_strength_remarks = COALESCE(@impact_strength_remarks, impact_strength_remarks)
            WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                inspection_date: inspection_date || null,
                micro_structure: microStructureJson,
                micro_structure_ok: micro_structure_ok ?? null,
                micro_structure_remarks: micro_structure_remarks || null,
                mech_properties: mechPropertiesJson,
                mech_properties_ok: mech_properties_ok ?? null,
                mech_properties_remarks: mech_properties_remarks || null,
                impact_strength: impactStrengthJson,
                impact_strength_ok: impact_strength_ok ?? null,
                impact_strength_remarks: impact_strength_remarks || null,
                trial_id
            });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Metallurgical inspection updated',
                remarks: `Metallurgical inspection for trial ${trial_id} updated by ${req.user.username}`
            });
            logger.info('Metallurgical inspection updated', { trial_id, updatedBy: req.user.username });
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

    res.status(200).json({
        success: true,
        message: "Metallurgical inspection updated successfully."
    });
};

export const getInspections = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection');
    res.status(200).json({ success: true, data: rows });
};

export const getInspectionByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};
