import Client from '../config/connection.js';
import { createDepartmentProgress, updateDepartment, updateRole } from '../services/departmentProgress.js';
import logger from '../config/logger.js';
import sendMail from '../utils/mailSender.js';

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
    const [rows] = await Client.query('SELECT * FROM trial_cards WHERE deleted_at IS NULL');
    res.status(200).json({ success: true, data: rows });
};

export const getTrialById = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM trial_cards WHERE trial_id = @trial_id AND deleted_at IS NULL', { trial_id });
    res.status(200).json({ success: true, data: rows });
};

export const getTrialReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT t.document_id, t.file_base64, t.file_name, c.trial_id, c.part_name, c.pattern_code, d.department_name AS department, c.current_department_id, c.material_grade, c.date_of_sampling, c.status FROM trial_cards c LEFT JOIN trial_reports t ON c.trial_id = t.trial_id AND t.deleted_at IS NULL LEFT JOIN departments d ON c.current_department_id = d.department_id WHERE c.deleted_at IS NULL");
    res.status(200).json({ success: true, data: rows });
};

export const getConsolidatedReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT c.document_id, c.file_base64, c.file_name, c.pattern_code, m.part_name FROM consolidated_reports c JOIN master_card m ON c.pattern_code = m.pattern_code");
    res.status(200).json({ success: true, data: rows });
};

export const getRecentTrialReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT TOP 10 t.document_id, t.file_base64, t.file_name, c.trial_id, c.part_name, c.pattern_code, d.department_name AS department, c.current_department_id, c.material_grade, c.date_of_sampling, c.status FROM trial_cards c LEFT JOIN trial_reports t ON c.trial_id = t.trial_id AND t.deleted_at IS NULL LEFT JOIN departments d ON c.current_department_id = d.department_id WHERE c.deleted_at IS NULL ORDER BY c.date_of_sampling DESC");
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

            const [userRows] = await trx.query(
                'SELECT email FROM users WHERE department_id IN (4, 6, 7) AND is_active = 1 AND email IS NOT NULL'
            );

            const emails = [...new Set(userRows.map(u => u.email))];

            if (emails.length > 0) {
                await sendMail({
                    to: emails,
                    subject: `Trial Updated: ${trial_id}`,
                    text: `The trial card ${trial_id} (${part_name}) has been updated by ${req.user.username}.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #E67E22;">Trial Card Update Notification</h2>
                            <p>The following trial card has been updated:</p>
                            <ul style="list-style: none; padding: 0;">
                                <li><strong>Trial ID:</strong> ${trial_id}</li>
                                <li><strong>Part Name:</strong> ${part_name}</li>
                                <li><strong>Pattern Code:</strong> ${pattern_code}</li>
                            </ul>
                            <p style="margin-top: 20px;">Please log in to the system to view the details.</p>
                            <hr style="border: 1px solid #eee; margin: 20px 0;">
                            <p style="font-size: 11px; color: #888;">This is an automated notification from SACL Digital Trial Card system.</p>
                        </div>
                    `
                });
                logger.info('Notification emails sent', { trial_id, recipients: emails.length });
            }
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

    const sql = `UPDATE trial_reports SET deleted_at = GETDATE(), deleted_by = @username WHERE trial_id = @trial_id AND deleted_at IS NULL`;

    await Client.query(sql, { trial_id, username: req.user.username });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report deleted',
        remarks: `Trial report soft deleted by ${req.user.username}: ${trial_id}`
    });

    logger.info('Trial report deleted', { trial_id, deletedBy: req.user.username });

    res.status(200).json({ success: true, message: 'Trial report deleted successfully.' });
};

export const getDeletedTrialReports = async (req, res, next) => {
    const [rows] = await Client.query("SELECT t.document_id, t.file_base64, t.file_name, t.deleted_at, t.deleted_by, c.trial_id, c.part_name, c.pattern_code, d.department_name AS department, c.current_department_id, c.material_grade, c.date_of_sampling, c.status FROM trial_cards c JOIN trial_reports t ON c.trial_id = t.trial_id AND t.deleted_at IS NOT NULL LEFT JOIN departments d ON c.current_department_id = d.department_id WHERE c.deleted_at IS NULL");
    res.status(200).json({ success: true, data: rows });
};

export const deleteTrialCard = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    const trialIds = Array.isArray(trial_id) ? trial_id : [trial_id];

    if (trialIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No trial IDs provided.' });
    }

    await Client.transaction(async (trx) => {
        for (const id of trialIds) {
            const sql = `UPDATE trial_cards SET deleted_at = GETDATE(), deleted_by = @username WHERE trial_id = @trial_id AND deleted_at IS NULL`;
            await trx.query(sql, { trial_id: id, username: req.user.username });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id: id,
                action: 'Trial card deleted',
                remarks: `Trial card ${id} soft deleted by ${req.user.username} (Bulk Delete)`
            });
        }
    });

    logger.info('Trial cards soft deleted', { trialIds, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: `${trialIds.length} trial card(s) deleted successfully.` });
};

export const getDeletedTrialCards = async (req, res, next) => {
    const sql = `SELECT c.trial_id, c.part_name, c.pattern_code, c.material_grade, c.date_of_sampling, c.status, c.deleted_at, c.deleted_by, d.department_name AS department 
                 FROM trial_cards c 
                 LEFT JOIN departments d ON c.current_department_id = d.department_id 
                 WHERE c.deleted_at IS NOT NULL`;
    const [rows] = await Client.query(sql);
    res.status(200).json({ success: true, data: rows });
};

export const restoreTrialCard = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    const sql = `UPDATE trial_cards SET deleted_at = NULL, deleted_by = NULL WHERE trial_id = @trial_id`;
    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Trial card restored',
        remarks: `Trial card ${trial_id} restored by ${req.user.username}`
    });

    logger.info('Trial card restored', { trial_id, restoredBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial card restored successfully.' });
};

export const permanentlyDeleteTrialCard = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided.' });
    }

    await Client.transaction(async (trx) => {
        await trx.query('DELETE FROM trial_cards WHERE trial_id = @trial_id AND deleted_at IS NOT NULL', { trial_id });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Trial card permanently deleted',
            remarks: `Trial card ${trial_id} permanently deleted by ${req.user.username}`
        });
    });

    logger.info('Trial card permanently deleted', { trial_id, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial card permanently deleted.' });
};

export const restoreTrialReport = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for restoration.' });
    }

    const sql = `UPDATE trial_reports SET deleted_at = NULL, deleted_by = NULL WHERE trial_id = @trial_id`;
    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report restored',
        remarks: `Trial report restored by ${req.user.username}: ${trial_id}`
    });

    logger.info('Trial report restored', { trial_id, restoredBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial report restored successfully.' });
};

export const permanentlyDeleteTrialReport = async (req, res, next) => {
    const { trial_id } = req.body;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'No trial ID provided for permanent deletion.' });
    }

    const sql = `DELETE FROM trial_reports WHERE trial_id = @trial_id AND deleted_at IS NOT NULL`;
    await Client.query(sql, { trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Trial report permanently deleted',
        remarks: `Trial report permanently deleted by ${req.user.username}: ${trial_id}`
    });

    logger.info('Trial report permanently deleted', { trial_id, deletedBy: req.user.username });
    res.status(200).json({ success: true, message: 'Trial report permanently deleted.' });
};

export const getProgressingTrials = async (req, res, next) => {
    const sql = `
        SELECT t.trial_id, t.part_name, t.pattern_code, t.current_department_id
        FROM trial_cards t
        WHERE t.status = 'IN_PROGRESS' AND t.deleted_at IS NULL
        AND NOT EXISTS (
            SELECT 1
            FROM department_progress dp
            WHERE dp.department_id = @department_id
            AND dp.approval_status = 'approved'
            AND dp.trial_id = t.trial_id
        );
    `;
    const [rows] = await Client.query(sql, { department_id: req.user.department_id });
    res.status(200).json({ success: true, data: rows });
};
