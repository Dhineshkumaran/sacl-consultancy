import Client from '../config/connection.js';
import { createDepartmentProgress, updateDepartment, updateRole } from '../services/departmentProgress.js';
import { updateTrialStatus } from '../services/trial.js';
import logger from '../config/logger.js';

export const createTrial = async (req, res, next) => {
    const { trial_id, part_name, pattern_code, trial_type, material_grade, initiated_by, date_of_sampling, plan_moulds, actual_moulds, reason_for_sampling, status, disa, sample_traceability, mould_correction, tooling_modification, remarks } = req.body || {};

    if (!trial_id || !part_name || !pattern_code || !trial_type || !material_grade || !initiated_by || !date_of_sampling || !plan_moulds || !reason_for_sampling || !disa || !sample_traceability) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const mouldJson = JSON.stringify(mould_correction);

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO trial_cards (trial_id, part_name, pattern_code, trial_type, material_grade, initiated_by, date_of_sampling, plan_moulds, actual_moulds, reason_for_sampling, status, current_department_id, disa, sample_traceability, mould_correction, tooling_modification, remarks) VALUES (@trial_id, @part_name, @pattern_code, @trial_type, @material_grade, @initiated_by, @date_of_sampling, @plan_moulds, @actual_moulds, @reason_for_sampling, @status, @current_department_id, @disa, @sample_traceability, @mould_correction, @tooling_modification, @remarks)';
        await trx.query(sql, {
            trial_id,
            part_name,
            pattern_code,
            trial_type,
            material_grade,
            initiated_by,
            date_of_sampling,
            plan_moulds,
            actual_moulds,
            reason_for_sampling,
            status: status || 'CREATED',
            current_department_id: 2,
            disa,
            sample_traceability,
            mould_correction: mouldJson,
            tooling_modification: tooling_modification,
            remarks: remarks || null
        });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Trial created',
            remarks: `Trial ${trial_id} created by ${req.user.username} with part name ${part_name}`
        });

        await createDepartmentProgress(trial_id, req.user, part_name, trx);
        if (req.user.role !== 'Admin') {
            await updateRole(trial_id, req.user, trx);
        }
    });

    logger.info('Trial created successfully', { trial_id, part_name, createdBy: req.user.username });
    res.status(201).json({ success: true, message: 'Trial created successfully.' });
};

export const getTrials = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM trial_cards');
    res.status(200).json({ success: true, data: rows });
};

export const getTrialById = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM trial_cards WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};

export const getTrialReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT t.document_id, t.file_base64, t.file_name, c.trial_id, c.part_name, c.pattern_code, d.department_name AS department, c.current_department_id, c.material_grade, c.date_of_sampling, c.status FROM trial_cards c LEFT JOIN trial_reports t ON c.trial_id = t.trial_id LEFT JOIN departments d ON c.current_department_id = d.department_id");
    res.status(200).json({ success: true, data: rows });
};

export const getConsolidatedReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT c.document_id, c.file_base64, c.file_name, c.pattern_code, m.part_name FROM consolidated_reports c JOIN master_card m ON c.pattern_code = m.pattern_code");
    res.status(200).json({ success: true, data: rows });
};

export const generateTrialId = async (req, res, next) => {
    let part_name = req.query.part_name;
    if (!part_name) {
        return res.status(400).json({ success: false, message: 'part_name query parameter is required' });
    }
    part_name = part_name.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT COUNT(*) AS count FROM trial_cards WHERE part_name = @part_name', { part_name });

    const count = rows[0].count + 1;
    const formattedId = `${part_name}-${count}`;
    res.status(200).json({ success: true, data: formattedId });
};

export const updateTrial = async (req, res, next) => {
    const {
        trial_id,
        part_name,
        pattern_code,
        trial_type,
        material_grade,
        date_of_sampling,
        plan_moulds,
        actual_moulds,
        reason_for_sampling,
        disa,
        sample_traceability,
        mould_correction,
        tooling_modification,
        remarks,
        is_edit
    } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required to update the trial' });
    }

    const mouldJson = mould_correction ? JSON.stringify(mould_correction) : null;

    await Client.transaction(async (trx) => {
        if (is_edit) {
            const sql = `UPDATE trial_cards SET 
                part_name = COALESCE(@part_name, part_name),
                pattern_code = COALESCE(@pattern_code, pattern_code),
                trial_type = COALESCE(@trial_type, trial_type),
                material_grade = COALESCE(@material_grade, material_grade),
                date_of_sampling = COALESCE(@date_of_sampling, date_of_sampling),
                plan_moulds = COALESCE(@plan_moulds, plan_moulds),
                actual_moulds = COALESCE(@actual_moulds, actual_moulds),
                reason_for_sampling = COALESCE(@reason_for_sampling, reason_for_sampling),
                disa = COALESCE(@disa, disa),
                sample_traceability = COALESCE(@sample_traceability, sample_traceability),
                mould_correction = COALESCE(@mould_correction, mould_correction),
                tooling_modification = COALESCE(@tooling_modification, tooling_modification),
                remarks = COALESCE(@remarks, remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                part_name,
                pattern_code,
                trial_type,
                material_grade,
                date_of_sampling,
                plan_moulds,
                actual_moulds,
                reason_for_sampling,
                disa,
                sample_traceability,
                mould_correction: mouldJson,
                tooling_modification,
                remarks,
                trial_id
            });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Trial updated',
                remarks: `Trial ${trial_id} updated by ${req.user.username}`
            });
            logger.info('Trial updated', { trial_id, updatedBy: req.user.username });
        }
        if (req.user.role !== 'Admin') {
            await updateDepartment(trial_id, req.user, trx);
        }
    });

    res.status(200).json({ success: true, message: 'Trial updated successfully.' });
};

export const deleteTrialReports = async (req, res, next) => {
    const { trial_id } = req.body;

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for deletion.' });
    }

    const sql = `DELETE FROM trial_reports WHERE trial_id = @trial_id`;

    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report deleted',
        remarks: `Trial report deleted by ${req.user.username}: ${trial_id}`
    });

    logger.info('Trial report deleted', { trial_id, deletedBy: req.user.username });

    res.status(200).json({ success: true, message: 'Trial report deleted successfully.' });
};