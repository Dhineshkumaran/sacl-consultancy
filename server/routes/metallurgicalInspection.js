import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, user_name, dates, micro_examination, remarks } = req.body || {};
    if (!trial_id || !user_name || !dates || !micro_examination || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const microExaminationJson = JSON.stringify(micro_examination);
    const sql = 'INSERT INTO metallurgical_inspection (trial_id, user_name, dates, micro_examination, remarks) VALUES (?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, user_name, dates, microExaminationJson, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Metallurgical inspection created', `Metallurgical inspection ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Metallurgical inspection created successfully.', id: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM metallurgical_inspection WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE metallurgical_inspection (
//     inspection_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     user_name TEXT,
//     date DATE,
//     micro_examination JSON[],
//     remarks TEXT
// );

// micro_examination [{"Cavity number": "", "Nodularity": "", "Matrix": "", "Carbide": "", "Inclusion": ""} ]

// API: http://localhost:3000/metallurgical-inspection
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "inspection_id": 1,
//             "trial_id": "trial_id",
//             "user_name": "user_name",
//             "date": "date",
//             "micro_examination": [{"Cavity number": "", "Nodularity": "", "Matrix": "", "Carbide": "", "Inclusion": ""} ],
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/metallurgical-inspection/trial_id
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
//             "user_name": "user_name",
//             "date": "date",
//             "micro_examination": [{"Cavity number": "", "Nodularity": "", "Matrix": "", "Carbide": "", "Inclusion": ""} ],
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/metallurgical-inspection
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "user_name": "user_name",
//     "date": "date",
//     "micro_examination": [{"Cavity number": "", "Nodularity": "", "Matrix": "", "Carbide": "", "Inclusion": ""} ],
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "message": "Metallurgical inspection created successfully."
// }