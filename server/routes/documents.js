import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    console.log("req.body", req.body);
    const { trial_id, document_type, file_name, file_base64, uploaded_by, remarks } = req.body;
    const [result] = await Client.query(
        `INSERT INTO documents (trial_id, document_type, file_name, file_base64, uploaded_by, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
        [trial_id, document_type, file_name, file_base64, uploaded_by, remarks]
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Document uploaded', `Document ${file_name} uploaded by ${req.user.username} with trial id ${trial_id} for ${document_type}`]);
    const insertId = result.insertId;
    res.status(201).json({
        message: "Document uploaded successfully.",
        success: true
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id } = req.query;
    const [documents] = await Client.query(
        `SELECT * FROM documents WHERE trial_id = ? ORDER BY document_id`,
        [trial_id]
    );
    res.status(200).json({
        success: true,
        data: documents || []
    });
}));

export default router;

// CREATE TABLE documents (
//     document_id SERIAL PRIMARY KEY,
//     trial_id INT REFERENCES trial_cards(trial_id) ON DELETE CASCADE,
//     document_type VARCHAR(50) NOT NULL,
//     file_name VARCHAR(255) NOT NULL,
//     file_base64 TEXT,
//     uploaded_by INT REFERENCES users(user_id),
//     uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     remarks TEXT
// );

// API: http://localhost:3000/documents
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "document_type": "document_type",
//     "file_name": "file_name",
//     "file_base64": "file_base64",
//     "uploaded_by": "uploaded_by",
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "data": "Document uploaded successfully."
// }

// API: http://localhost:3000/documents
// Method: GET
// Sample data: 
// {
//     "trial_id": "trial_id"
// }
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "document_id": 1,
//             "trial_id": "trial_id",
//             "document_type": "document_type",
//             "file_name": "file_name",
//             "file_base64": "file_base64",
//             "uploaded_by": "uploaded_by",
//             "uploaded_at": "uploaded_at",
//             "remarks": "remarks"
//         }
//     ]
// }
