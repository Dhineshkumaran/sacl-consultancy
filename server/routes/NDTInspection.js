import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, ndt, ndt_ok, remarks } = req.body || {};
    if (!trial_id || !ndt || !ndt_ok || !remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const ndtJson = JSON.stringify(ndt);
    const sql = 'INSERT INTO ndt_inspection (trial_id, ndt, ndt_ok, remarks) VALUES (?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, ndtJson, ndt_ok, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'NDT inspection created', `NDT inspection ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'NDT inspection created successfully.' });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM ndt_inspection');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM ndt_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE ndt_inspection (
//     inspection_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     ndt JSON[],
//     ndt_ok BOOLEAN,
//     remarks TEXT
// );

// ndt [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}]

// API: http://localhost:3000/ndt-inspection
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "inspection_id": 1,
//             "trial_id": "trial_id",
//             "ndt": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}],
//             "ndt_ok": true,
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/ndt-inspection
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "ndt": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}],
//     "ndt_ok": true,
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "message": "NDT inspection created successfully."
// }

// API: http://localhost:3000/ndt-inspection/trial_id
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
//             "inspection_id": 1,
//             "trial_id": "trial_id",
//             "ndt": [{"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}, {"Cavity number": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection:": ""}],
//             "ndt_ok": true,
//             "remarks": "remarks"
//         }
//     ]
// }