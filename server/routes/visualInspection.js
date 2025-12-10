import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspections, visual_ok, remarks } = req.body || {};
    if (!trial_id || !inspections || !visual_ok || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);
    const sql = 'INSERT INTO visual_inspection (trial_id, inspections, visual_ok, remarks) VALUES (?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, inspectionsJson, visual_ok, remarks]);
    // const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    // const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Visual inspection created', `Visual inspection ${trial_id} created by ${req.user.username}`]);
    res.status(201).json({ success: true, message: 'Visual inspection created successfully.' });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM visual_inspection');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM visual_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE visual_inspection (
//     inspection_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     inspections JSON[],
//     visual_ok BOOLEAN,
//     remarks TEXT
// );

// inspections [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}]

// API: http://localhost:3000/visual-inspection
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "inspection_id": "inspection_id",
//             "trial_id": "trial_id",
//             "inspections": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}],
//             "visual_ok": true,
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/visual-inspection
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "inspections": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}],
//     "visual_ok": true,
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "message": "Visual inspection created successfully."
// }

// API: http://localhost:3000/visual-inspection/trial_id
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
//             "inspection_id": "inspection_id",
//             "trial_id": "trial_id",
//             "inspections": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Rejection Percentage": "", "Reason for rejection": ""}],
//             "visual_ok": true,
//             "remarks": "remarks"
//         }
//     ]
// }