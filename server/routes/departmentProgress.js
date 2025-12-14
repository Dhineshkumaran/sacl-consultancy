import express from 'express';
const router = express.Router();
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';
import verifyToken from '../utils/verifyToken.js';

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
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

router.put('/update-department', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { progress_id, trial_id, next_department_id, username, role, remarks } = req.body;
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result_completion] = await Client.query(audit_sql_completion, [req.user.user_id, req.user.department_id, 'Department progress updated', `Department progress ${progress_id} updated by ${username} with trial id ${trial_id} as completed at ${req.user.department}`]);

    const next_department_user = await Client.query(
        `SELECT * FROM users WHERE department_id = ? AND role = 'User' LIMIT 1`,
        [next_department_id]
    );
    if (next_department_user.length === 0) {
        throw new CustomError("No user found for the department.");
    }
    const next_department_username = next_department_user[0][0].username;
    const [result] = await Client.query(
        `UPDATE department_progress SET department_id = ?, username = ?, remarks = ? WHERE progress_id = ?`,
        [next_department_id, next_department_username, remarks, progress_id]
    );
    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result_assignment] = await Client.query(audit_sql_assignment, [req.user.user_id, req.user.department_id, 'Department progress updated', `Department progress ${progress_id} updated by ${req.user.username} with trial id ${trial_id} to department ${next_department_id} for ${role}`]);

    const user = await Client.query(
        `SELECT * FROM users WHERE username = ?`,
        [next_department_username]
    );
    const mailOptions = {
        to: user[0].email,
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>Department progress <strong>${progress_id}</strong> has been assigned to you by <strong>${req.user.username}</strong>.</p>
                <p><strong>Trial ID:</strong> ${trial_id}</p>
                <p>Please check the progress by logging into the application.</p>
                <p><a href="http://localhost:5173/dashboard" style="background-color: #2950bb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
            </div>
        `,
        attachments: [{
            filename: 'SACL-LOGO-01.jpg',
            path: path.resolve(__dirname, '../assets/SACL-LOGO-01.jpg'),
            cid: 'sacllogo'
        }]
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({
        success: true,
        data: "Department progress updated successfully"
    });
}));

router.put('/update-role', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { progress_id, trial_id, current_department_id, username, role, remarks } = req.body;
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result_completion] = await Client.query(audit_sql_completion, [req.user.user_id, req.user.department_id, 'Department progress completed', `Department progress ${progress_id} marked as completed by ${req.user.username} with trial id ${trial_id}`]);
    const current_department_hod = await Client.query(
        `SELECT * FROM users WHERE department_id = ? AND role = 'HOD' LIMIT 1`,
        [current_department_id]
    );
    if (current_department_hod.length === 0) {
        throw new CustomError("No HOD found for the department.");
    }
    const current_department_hod_username = current_department_hod[0][0].username;
    const [result] = await Client.query(
        `UPDATE department_progress SET username = ?, remarks = ?, approval_status = 'pending' WHERE progress_id = ?`,
        [current_department_hod_username, remarks, progress_id]
    );
    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result_assignment] = await Client.query(audit_sql_assignment, [req.user.user_id, req.user.department_id, 'Department progress updated', `Department progress ${progress_id} assigned to HOD ${current_department_hod_username} by ${req.user.username} with trial id ${trial_id}`]);
    const user = await Client.query(
        `SELECT * FROM users WHERE username = ?`,
        [current_department_hod_username]
    );
    const mailOptions = {
        to: 'trackkumaran@gmail.com',
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>Department progress <strong>${progress_id}</strong> has been assigned to you by <strong>${req.user.username}</strong>.</p>
                <p><strong>Trial ID:</strong> ${trial_id}</p>
                <p>Please check the progress by logging into the application.</p>
                <p><a href="http://localhost:5173/dashboard" style="background-color: #2950bb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
            </div>
        `,
        attachments: [{
            filename: 'SACL-LOGO-01.jpg',
            path: path.resolve(__dirname, '../assets/SACL-LOGO-01.jpg'),
            cid: 'sacllogo'
        }]
    };
    await transporter.sendMail(mailOptions);
    res.status(200).json({
        success: true,
        data: "Department progress updated successfully"
    });
}));

router.put('/approve', verifyToken, asyncErrorHandler(async (req, res, next) => {
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

router.get('/get-progress', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const username = req.query.username;
    const [result] = await Client.query(
        `SELECT * FROM department_progress WHERE username = ? AND department_id = ? AND approval_status = 'pending' LIMIT 1`,
        [username, req.user.department_id]
    );
    res.status(200).json({
        success: true,
        data: result
    });
}));
export default router;

// INSERT INTO department_progress (trial_id, department_id, username, completed_at, approval_status, remarks) VALUES (1, 10, 'methods', '2022-01-01', 'pending', 'remarks');

// CREATE TABLE department_progress (
//     progress_id SERIAL PRIMARY KEY,
//     trial_id VARCHAR(255) REFERENCES trial_cards(trial_id),
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
//     "trial_id": "1",
//     "department_id": 1,
//     "username": "user1",
//     "completed_at": "2022-01-01",
//     "approval_status": "pending",
//     "remarks": "remarks"
// }

// API: http://localhost:3000/department-progress/update-department
// Method: PUT
// Sample data: 
// {
//     "progress_id": 1,
//     "next_department_id": 1,
//     "username": "user1",
//     "role": "HOD",
//     "remarks": "remarks"
// }
// Response: 
// {
//     "success": true,
//     "data": "Department progress updated successfully"
// }

// API: http://localhost:3000/department-progress/update-role
// Method: PUT
// Sample data: 
// {
//     "progress_id": 1,
//     "current_department_id": 1,
//     "username": "user1",
//     "role": "user",
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
//     "trial_id": "1"
// }
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "progress_id": 1,
//             "trial_id": "1",
//             "department_id": 1,
//             "username": "user1",
//             "completed_at": "2022-01-01",
//             "approval_status": "pending",
//             "remarks": "remarks"
//         },
//         {
//             "progress_id": 2,
//             "trial_id": "1",
//             "department_id": 2,
//             "username": "user2",
//             "completed_at": "2022-01-02",
//             "approval_status": "pending",
//             "remarks": "remarks"
//         }
//     ]
// }

//ALTER TABLE department_progress MODIFY COLUMN trial_id VARCHAR(255);