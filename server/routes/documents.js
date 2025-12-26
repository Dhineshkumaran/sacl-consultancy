import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    console.log("req.body", req.body);
    const { trial_id, document_type, file_name, file_base64, uploaded_by, remarks } = req.body;
    const [result] = await Client.query(
        `INSERT INTO documents (trial_id, document_type, file_name, file_base64, uploaded_by, remarks) VALUES (@trial_id, @document_type, @file_name, @file_base64, @uploaded_by, @remarks)`,
        { trial_id, document_type, file_name, file_base64, uploaded_by, remarks }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Document uploaded',
        remarks: `Document ${file_name} uploaded by ${req.user.username} with trial id ${trial_id} for ${document_type}`
    });
    res.status(201).json({
        message: "Document uploaded successfully.",
        success: true
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id } = req.query;
    const [documents] = await Client.query(
        `SELECT * FROM documents WHERE trial_id = @trial_id ORDER BY document_id`,
        { trial_id }
    );
    res.status(200).json({
        success: true,
        data: documents || []
    });
}));

export default router;