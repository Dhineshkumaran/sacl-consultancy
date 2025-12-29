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
    const { trial_id, department_id, completed_at, approval_status, current_form, remarks, username } = req.body;
    const [result] = await Client.query(
        `INSERT INTO department_progress (trial_id, department_id, completed_at, approval_status, current_form, remarks, username) VALUES (@trial_id, @department_id, @completed_at, @approval_status, @current_form, @remarks, @username)`,
        { trial_id, department_id, completed_at, approval_status, current_form, remarks, username }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress added',
        remarks: `Department progress for trial ${trial_id} added by ${username} to department ${department_id}`
    });
    res.status(201).json({
        success: true,
        data: "Department progress added successfully"
    });
}));

router.put('/update-department', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { trial_id, next_department_id, username, current_form, role, remarks } = req.body;
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result_completion] = await Client.query(audit_sql_completion, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress updated',
        remarks: `Department progress for trial ${trial_id} updated by ${username} as completed at ${req.user.department}`
    });

    const next_department_user_result = await Client.query(
        `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User'`,
        { next_department_id }
    );
    const next_department_user = next_department_user_result[0];
    if (next_department_user.length === 0) {
        throw new CustomError("No user found for the department.");
    }
    const next_department_username = next_department_user[0].username;
    const [result] = await Client.query(
        `UPDATE department_progress SET department_id = @next_department_id, username = @next_department_username, remarks = @remarks, current_form = @current_form WHERE trial_id = @trial_id`,
        { next_department_id, next_department_username, remarks, trial_id, current_form }
    );

    await Client.query(
        `UPDATE trial_cards SET current_department_id = @next_department_id WHERE trial_id = @trial_id`,
        { next_department_id, trial_id }
    );

    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result_assignment] = await Client.query(audit_sql_assignment, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress approved',
        remarks: `Department progress for trial ${trial_id} approved by ${req.user.username} to department ${next_department_id} for ${role}`
    });

    const mailOptions = {
        to: next_department_user[0].email,
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>Department progress for trial <strong>${trial_id}</strong> has been assigned to you by <strong>${req.user.username}</strong>.</p>
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
        data: "Department progress approved successfully"
    });
}));

router.put('/update-role', verifyToken, asyncErrorHandler(async (req, res, next) => {
    console.log(req.body);
    const { trial_id, current_department_id, username, role, remarks } = req.body;
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result_completion] = await Client.query(audit_sql_completion, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress completed',
        remarks: `Department progress for trial ${trial_id} marked as completed by ${req.user.username}`
    });
    const current_department_hod_result = await Client.query(
        `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD'`,
        { current_department_id }
    );
    const current_department_hod = current_department_hod_result[0];
    if (current_department_hod.length === 0) {
        throw new CustomError("No HOD found for the department.");
    }
    const current_department_hod_username = current_department_hod[0].username;
    const [result] = await Client.query(
        `UPDATE department_progress SET username = @current_department_hod_username, remarks = @remarks, approval_status = 'pending' WHERE trial_id = @trial_id`,
        { current_department_hod_username, remarks, trial_id }
    );
    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result_assignment] = await Client.query(audit_sql_assignment, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress updated',
        remarks: `Department progress for trial ${trial_id} assigned to HOD ${current_department_hod_username} by ${req.user.username}`
    });
    const user_result = await Client.query(
        `SELECT * FROM users WHERE username = @username`,
        { username: current_department_hod_username }
    );
    const user = user_result[0];
    const mailOptions = {
        to: user[0].email,
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>Department progress for trial <strong>${trial_id}</strong> has been assigned to you by <strong>${req.user.username}</strong>.</p>
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
    const { trial_id } = req.body;
    const [result] = await Client.query(
        `UPDATE department_progress SET approval_status = 'approved' WHERE trial_id = @trial_id`,
        { trial_id }
    );
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        trial_id,
        action: 'Department progress approved',
        remarks: `Department progress for trial ${trial_id} approved by ${req.user.username}`
    });
    res.status(200).json({
        success: true,
        data: "Department progress approved successfully"
    });
}));

router.get('/get-progress', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const username = req.query.username;
    const [result] = await Client.query(
        `SELECT department_progress.*, departments.department_name, t.part_name, t.pattern_code, t.disa, t.date_of_sampling FROM department_progress 
         JOIN departments ON department_progress.department_id = departments.department_id 
         JOIN trial_cards t ON department_progress.trial_id = t.trial_id 
         WHERE department_progress.username = @username AND department_progress.approval_status = 'pending'`,
        { username }
    );
    res.status(200).json({
        success: true,
        data: result
    });
}));

router.get('/get-completed-trials', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const username = req.query.username;

    const [result] = await Client.query(
        `SELECT DISTINCT 
            a.trial_id,
            a.department_id,
            a.action_timestamp as completed_at,
            a.remarks,
            d.department_name,
            t.part_name,
            t.pattern_code,
            t.disa,
            t.date_of_sampling,
            t.status
         FROM audit_log a
         JOIN trial_cards t ON a.trial_id = t.trial_id
         JOIN departments d ON a.department_id = d.department_id
         WHERE a.department_id = @department_id 
         AND (a.action = 'Department progress approved')
         AND a.trial_id IS NOT NULL
         ORDER BY a.action_timestamp DESC`,
        { department_id: req.user.department_id }
    );

    res.status(200).json({
        success: true,
        data: result
    });
}));
export default router;