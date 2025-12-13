import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks } = req.body || {};
    console.log('req.body:', req.body);
    if (!trial_id || !pour_date || !heat_code || !composition || !pouring_temp_c || !pouring_time_sec || !inoculation || !other_remarks || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const compositionJson = JSON.stringify(composition);
    const otherRemarksJson = JSON.stringify(other_remarks);
    const inoculationJson = JSON.stringify(inoculation);
    const sql = 'INSERT INTO pouring_details (trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, pour_date, heat_code, compositionJson, pouring_temp_c, pouring_time_sec, inoculationJson, otherRemarksJson, remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details created', `Pouring details ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Pouring details created successfully.' });
}));

router.put('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, pour_date, heat_code, composition, pouring_temp_c, pouring_time_sec, inoculation, other_remarks, remarks } = req.body || {};
    if (!trial_id || !pour_date || !heat_code || !composition || !pouring_temp_c || !pouring_time_sec || !inoculation || !other_remarks || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const compositionJson = JSON.stringify(composition);
    const otherRemarksJson = JSON.stringify(other_remarks);
    const inoculationJson = JSON.stringify(inoculation);
    const sql = 'UPDATE pouring_details SET pour_date = ?, heat_code = ?, composition = ?, pouring_temp_c = ?, pouring_time_sec = ?, inoculation = ?, other_remarks = ?, remarks = ? WHERE trial_id = ?';
    const [result] = await Client.query(sql, [pour_date, heat_code, compositionJson, pouring_temp_c, pouring_time_sec, inoculationJson, otherRemarksJson, remarks, trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details updated', `Pouring details ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`]);
    const insertId = result.insertId;
    res.status(201).json({
        success: true,
        message: "Pouring details updated successfully."
    });
}));

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM pouring_details');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM pouring_details WHERE trial_id = ?', [trial_id]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Pouring details created', `Pouring details ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(200).json({ success: true, data: rows });
}));

export default router;

// CREATE TABLE pouring_details (
//     id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     pour_date DATE,
//     heat_code TEXT,
//     composition JSON,
//     pouring_temp_c NUMERIC(6,2),
//     pouring_time_sec INT,
//     inoculation JSON,
//     other_remarks JSON,
//     remarks TEXT
// );

// composition {"C": "", "Si": "", "Mn": "", "P": "", "S": "", "Mg": "", "Cu": "", "Cr": ""}
// other_remarks {"F/C & Heat No." : "", "PP Code" : "", "Followed by" : "", "Username" : ""}
// inoculation {"Stream" : "", "Inmould" : ""}

// API: http://localhost:3000/pouring-details
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "id": 1,
//             "trial_id": "trial_id",
//             "pour_date": "pour_date",
//             "heat_code": "heat_code",
//             "composition": {"C": "", "Si": "", "Mn": "", "P": "", "S": "", "Mg": "", "Cu": "", "Cr": ""},
//             "pouring_temp_c": 0,
//             "pouring_time_sec": 0,
//             "inoculation": {"Stream" : "", "Inmould" : ""},
//             "other_remarks": {"F/C & Heat No." : "", "PP Code" : "", "Followed by" : "", "Username" : ""},
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/pouring-details
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "pour_date": "pour_date",
//     "heat_code": "heat_code",
//     "composition": {"C": "", "Si": "", "Mn": "", "P": "", "S": "", "Mg": "", "Cu": "", "Cr": ""},
//     "pouring_temp_c": 0,
//     "pouring_time_sec": 0,
//     "inoculation": {"Stream" : "", "Inmould" : ""},
//     "other_remarks": {"F/C & Heat No." : "", "PP Code" : "", "Followed by" : "", "Username" : ""},
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "message": "Pouring details created successfully."
// }

// API: http://localhost:3000/pouring-details/trial_id
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
//             "id": 1,
//             "trial_id": "trial_id",
//             "pour_date": "pour_date",
//             "heat_code": "heat_code",
//             "composition": {"C": "", "Si": "", "Mn": "", "P": "", "S": "", "Mg": "", "Cu": "", "Cr": ""},
//             "pouring_temp_c": 0,
//             "pouring_time_sec": 0,
//             "inoculation": {"Stream" : "", "Inmould" : ""},
//             "other_remarks": {"F/C & Heat No." : "", "PP Code" : "", "Followed by" : "", "Username" : ""},
//             "remarks": "remarks"
//         }
//     ]
// }