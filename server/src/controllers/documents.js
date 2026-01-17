import Client from '../config/connection.js';
import logger from '../config/logger.js';

export const uploadDocument = async (req, res, next) => {
    const { trial_id, document_type, file_name, file_base64, remarks } = req.body;
    await Client.query(
        `INSERT INTO documents (trial_id, document_type, file_name, file_base64, uploaded_by, remarks) VALUES (@trial_id, @document_type, @file_name, @file_base64, @uploaded_by, @remarks)`,
        { trial_id, document_type, file_name, file_base64, uploaded_by: req.user.user_id, remarks }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Document uploaded',
        remarks: `Document ${file_name} uploaded by ${req.user.username} with trial id ${trial_id} for ${document_type}`
    });

    logger.info('Document uploaded', { trial_id, document_type, file_name, uploadedBy: req.user.username });

    res.status(201).json({
        message: "Document uploaded successfully.",
        success: true
    });
};

export const getDocuments = async (req, res, next) => {
    const { trial_id } = req.query;
    const [documents] = await Client.query(
        `SELECT d.*, u.username as uploaded_by_username 
         FROM documents d 
         LEFT JOIN users u ON d.uploaded_by = u.user_id 
         WHERE d.trial_id = @trial_id 
         ORDER BY d.document_id`,
        { trial_id }
    );
    res.status(200).json({
        success: true,
        data: documents || []
    });
};
