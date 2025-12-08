import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, department_id, completed_at, approval_status, remarks, username } = req.body;
    const [result] = await Client.query(
        `INSERT INTO department_progress (trial_id, department_id, completed_at, approval_status, remarks, username) VALUES (?, ?, ?, ?, ?, ?)`,
        [trial_id, department_id, completed_at, approval_status, remarks, username]
    );
    const user = await Client.query(
        `SELECT * FROM users WHERE username = ?`,
        [username]
    );
    const mailOptions = {
        to: user[0].email,
        subject: 'Department Progress Added',
        text: `Department progress ${result.insertId} added by ${username} with trial id ${trial_id} to department ${department_id}. Please check the progress by logging into the application.`
    };
    await transporter.sendMail(mailOptions);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Department progress added', `Department progress ${result.insertId} added by ${username} with trial id ${trial_id} to department ${department_id}`]);
    res.status(201).json({
        success: true,
        data: "Department progress added successfully"
    });
}));

router.put('/update', asyncErrorHandler(async (req, res, next) => {
    const { progress_id, current_department_id, username, role, remarks } = req.body;
    if (role == 'HOD') {
        const next_department_id = current_department_id + 1;
        const next_department_user = await Client.query(
            `SELECT * FROM users WHERE department_id = ? AND role = 'user'`,
            [next_department_id]
        );
        if (next_department_user.length === 0) {
            throw new CustomError("No user found for the department.");
        }
        const next_department_username = next_department_user[0].username;
        const [result] = await Client.query(
            `UPDATE department_progress SET department_id = ?, username = ?, remarks = ? WHERE progress_id = ?`,
            [next_department_id, next_department_username, remarks, progress_id]
        );
        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
        const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Department progress updated', `Department progress ${progress_id} updated by ${req.user.username} with trial id ${trial_id} to department ${next_department_id} for ${role}`]);
        const user = await Client.query(
            `SELECT * FROM users WHERE username = ?`,
            [next_department_username]
        );
        const mailOptions = {
            to: user[0].email,
            subject: 'Department Progress Updated',
            text: `Department progress ${progress_id} updated by ${req.user.username} with trial id ${trial_id} to department ${next_department_id} for ${role}. Please check the progress by logging into the application.`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({
            success: true,
            data: "Department progress updated successfully"
        });
    }
    else if (role == 'user') {
        const current_department_hod = await Client.query(
            `SELECT * FROM users WHERE department_id = ? AND role = 'HOD'`,
            [current_department_id]
        );
        if (current_department_hod.length === 0) {
            throw new CustomError("No HOD found for the department.");
        }
        const current_department_hod_username = current_department_hod[0].username;
        const [result] = await Client.query(
            `UPDATE department_progress SET username = ?, remarks = ? WHERE progress_id = ?`,
            [current_department_hod_username, remarks, progress_id]
        );
        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
        const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Department progress updated', `Department progress ${progress_id} updated by ${req.user.username} with trial id ${trial_id} to department ${current_department_hod_username} for ${role}`]);
        const user = await Client.query(
            `SELECT * FROM users WHERE username = ?`,
            [current_department_hod_username]
        );
        const mailOptions = {
            to: user[0].email,
            subject: 'Department Progress Updated',
            text: `Department progress ${progress_id} updated by ${req.user.username} with trial id ${trial_id} to department ${current_department_hod_username} for ${role}. Please check the progress by logging into the application.`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({
            success: true,
            data: "Department progress updated successfully"
        });
    }
}));

router.put('/approve', asyncErrorHandler(async (req, res, next) => {
    const { progress_id, remarks } = req.body;
    const [result] = await Client.query(
        `UPDATE department_progress SET approval_status = 'approved', remarks = ? WHERE progress_id = ?`,
        [remarks, progress_id]
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Department progress approved', `Department progress ${progress_id} approved by ${req.user.username} with trial id ${trial_id}`]);
    res.status(200).json({
        success: true,
        data: "Department progress approved successfully"
    });
}));

router.get('/get-progress', asyncErrorHandler(async (req, res, next) => {
    const trial_id = req.query.trial_id;
    const [result] = await Client.query(
        `SELECT * FROM department_progress WHERE trial_id = ?`,
        [trial_id]
    );
    res.status(200).json({
        success: true,
        data: result
    });
}));

export default router;

// CREATE TABLE department_progress (
//     progress_id SERIAL PRIMARY KEY,
//     trial_id INT REFERENCES trial_cards(trial_id),
//     department_id INT REFERENCES departments(department_id),
//     username VARCHAR(50) REFERENCES users(username),
//     completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     approval_status VARCHAR(20) DEFAULT 'pending',
//     remarks TEXT
// );

// API: http://localhost:3000/department-progress
// Method: POST
// Sample data: 
// {
//     "trial_id": 1,
//     "department_id": 1,
//     "username": "user1",
//     "completed_at": "2022-01-01",
//     "approval_status": "pending",
//     "remarks": "remarks"
// }

// API: http://localhost:3000/department-progress/update
// Method: PUT
// Sample data: 
// {
//     "progress_id": 1,
//     "current_department_id": 1,
//     "username": "user1",
//     "role": "HOD",
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "data": "Department progress updated successfully"
// }

// API: http://localhost:3000/department-progress/approve
// Method: PUT
// Sample data: 
// {
//     "progress_id": 1,
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "data": "Department progress approved successfully"
// }

// API: http://localhost:3000/department-progress/get-progress
// Method: GET
// Sample data: 
// {
//     "trial_id": 1
// }
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "progress_id": 1,
//             "trial_id": 1,
//             "department_id": 1,
//             "username": "user1",
//             "completed_at": "2022-01-01",
//             "approval_status": "pending",
//             "remarks": "remarks"
//         },
//         {
//             "progress_id": 2,
//             "trial_id": 1,
//             "department_id": 2,
//             "username": "user2",
//             "completed_at": "2022-01-02",
//             "approval_status": "pending",
//             "remarks": "remarks"
//         }
//     ]
// }