import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, inspection_date, inspections, remarks } = req.body || {};
    if (!trial_id || !inspection_date || !inspections || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const inspectionsJson = JSON.stringify(inspections);
    const sql = 'INSERT INTO machine_shop (trial_id, inspection_date, inspections, remarks) VALUES (?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, inspection_date, inspectionsJson, remarks]);
    // const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    // const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Machine shop created', `Machine shop ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    const insertId = result.insertId;
    res.status(201).json({
        success: true,
        message: "Machine shop created successfully.",
        id: insertId
    });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM machine_shop');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM machine_shop WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE machine_shop (
//     machine_shop_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     inspection_date DATE,
//     inspections JSON[]
//     remarks TEXT
// );

// inspections [{"Cavity Details": "", "Received Quantity": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection": ""}]

// API: http://localhost:3000/machine-shop
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "inspection_date": "inspection_date",
//     "inspections": [{"Cavity Details": "", "Received Quantity": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection": ""}],
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "data": "Machine shop created successfully."
// }

// API: http://localhost:3000/machine-shop
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "machine_shop_id": 1,
//             "trial_id": "trial_id",
//             "inspection_date": "inspection_date",
//             "inspections": [{"Cavity Details": "", "Received Quantity": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection": ""}],
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/machine-shop/trial_id
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
//             "machine_shop_id": 1,
//             "trial_id": "trial_id",
//             "inspection_date": "inspection_date",
//             "inspections": [{"Cavity Details": "", "Received Quantity": "", "Inspected Quantity": "", "Accepted Quantity": "", "Rejected Quantity": "", "Reason for rejection": ""}],
//             "remarks": "remarks"
//         }
//     ]
// }