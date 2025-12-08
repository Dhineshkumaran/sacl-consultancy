import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks } = req.body || {};
    if (!trial_id || !date || !t_clay || !a_clay || !vcm || !loi || !afs || !gcs || !moi || !compactability || !permeability || !other_remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO sand_properties (trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Sand properties created', `Sand properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`]);
    res.status(201).json({ success: true, message: 'Sand properties created successfully.' });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM sand_properties');
    res.status(200).json({ success: true, data: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM sand_properties WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ success: true, data: rows });
}));

// CREATE TABLE sand_properties (
//     prop_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id) NOT NULL,
//     date DATE,
//     t_clay NUMERIC(6,3),
//     a_clay NUMERIC(6,3),
//     vcm NUMERIC(6,3),
//     loi NUMERIC(6,3),
//     afs NUMERIC(6,3),
//     gcs NUMERIC(6,3),
//     moi NUMERIC(6,3),
//     compactability NUMERIC(6,3),
//     permeability NUMERIC(6,3),
//     remarks TEXT
// );

// API: http://localhost:3000/sand-properties
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "prop_id": 1,
//             "trial_id": "trial_id",
//             "date": "date",
//             "t_clay": 0,
//             "a_clay": 0,
//             "vcm": 0,
//             "loi": 0,
//             "afs": 0,
//             "gcs": 0,
//             "moi": 0,
//             "compactability": 0,
//             "permeability": 0,
//             "remarks": "remarks"
//         }
//     ]
// }

// API: http://localhost:3000/sand-properties
// Method: POST
// Sample data: 
// {
//     "trial_id": "trial_id",
//     "date": "date",
//     "t_clay": 0,
//     "a_clay": 0,
//     "vcm": 0,
//     "loi": 0,
//     "afs": 0,
//     "gcs": 0,
//     "moi": 0,
//     "compactability": 0,
//     "permeability": 0,
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "message": "Sand properties created successfully."
// }

// API: http://localhost:3000/sand-properties/trial_id
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
//             "prop_id": 1,
//             "trial_id": "trial_id",
//             "date": "date",
//             "t_clay": 0,
//             "a_clay": 0,
//             "vcm": 0,
//             "loi": 0,
//             "afs": 0,
//             "gcs": 0,
//             "moi": 0,
//             "compactability": 0,
//             "permeability": 0,
//             "remarks": "remarks"
//         }
//     ]
// }