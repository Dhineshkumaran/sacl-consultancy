import path from 'path';
import { fileURLToPath } from 'url';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';
import { generateAndStoreReport } from './pdfGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createDepartmentProgress = async (trial_id, user, part_name, trx) => {
    const initial_department_sql = 'SELECT department_id FROM department_flow WHERE sequence_no=1';
    const [rows] = await trx.query(initial_department_sql);

    if (rows && rows.length > 0) {
        const department_id = rows[0].department_id;

        await trx.query(
            `INSERT INTO department_progress (trial_id, department_id, completed_at, approval_status, remarks, username) VALUES (@trial_id, @department_id, @completed_at, @approval_status, @remarks, @username)`,
            { trial_id, department_id, completed_at: new Date(), approval_status: 'pending', remarks: `Trial ${trial_id} created by ${user.username} for part name ${part_name}`, username: user.username }
        );

        const progress_audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(progress_audit_sql, {
            user_id: user.user_id,
            department_id: user.department_id,
            trial_id,
            action: 'Department progress added',
            remarks: `Department progress for trial ${trial_id} added by ${user.username} to department ${user.department_id}`
        });

    }
};

const assignToNextDepartmentUser = async (trial_id, next_department_id, user, trx) => {
    const next_department_user_result = await trx.query(
        `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1`,
        { next_department_id }
    );
    const [next_department_user] = next_department_user_result;

    if (!next_department_user) {
        throw new CustomError("No user found for the department/updating progress");
    }

    const next_department_username = next_department_user[0].username;

    await trx.query(
        `UPDATE department_progress SET department_id = @next_department_id, username = @next_department_username, remarks = 'User submission pending', approval_status = 'pending' WHERE trial_id = @trial_id`,
        { next_department_id, next_department_username, trial_id }
    );

    await trx.query(
        `UPDATE trial_cards SET current_department_id = @next_department_id, status = 'IN_PROGRESS' WHERE trial_id = @trial_id`,
        { next_department_id, trial_id }
    );

    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_assignment, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress updated',
        remarks: `Department progress for trial ${trial_id} assigned to user ${next_department_username} by ${user.username}`
    });

    const mailOptions = {
        to: next_department_user[0].email,
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>Department progress for trial <strong>${trial_id}</strong> has been assigned to you by <strong>${user.username}</strong>.</p>
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
    return "Department progress updated successfully";
};

export const updateDepartment = async (trial_id, user, trx) => {
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress updated',
        remarks: `Department progress for trial ${trial_id} updated by ${user.username} as completed at ${user.department_name}`
    });

    const [currentDepartment] = await trx.query(
        `SELECT department_id FROM department_progress WHERE trial_id = @trial_id`,
        { trial_id }
    );

    const [rows] = await trx.query(
        `SELECT df2.department_id AS next_department_id
            FROM department_flow df1
            JOIN department_flow df2
            ON df2.sequence_no = df1.sequence_no + 1
            WHERE df1.department_id = @currentDepartmentId`,
        { currentDepartmentId: currentDepartment[0].department_id }
    );

    if (!rows || rows.length === 0) {
        throw new CustomError("Next department not found in flow.");
    }
    const next_department_id = rows[0].next_department_id;

    return await assignToNextDepartmentUser(trial_id, next_department_id, user, trx);
};

export const updateRole = async (trial_id, user, trx) => {
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress completed',
        remarks: `Department progress for trial ${trial_id} marked as completed by ${user.username}`
    });
    const [currentDepartment] = await trx.query(
        `SELECT department_id FROM department_progress WHERE trial_id = @trial_id`,
        { trial_id }
    );
    const [current_department_hod] = await trx.query(
        `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1`,
        { current_department_id: currentDepartment[0].department_id }
    );
    if (current_department_hod && current_department_hod.length > 0) {
        const current_department_hod_username = current_department_hod[0].username;
        await trx.query(
            `UPDATE department_progress SET username = @current_department_hod_username, remarks = 'HOD approval pending', approval_status = 'pending' WHERE trial_id = @trial_id`,
            { current_department_hod_username, trial_id }
        );
        const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql_assignment, {
            user_id: user.user_id,
            department_id: user.department_id,
            trial_id,
            action: 'Department progress updated',
            remarks: `Department progress for trial ${trial_id} assigned to HOD ${current_department_hod_username} by ${user.username}`
        });
        const user_result = await trx.query(
            `SELECT * FROM users WHERE username = @username`,
            { username: current_department_hod_username }
        );
        const [targetUser] = user_result;
        const mailOptions = {
            to: targetUser.email,
            subject: 'A new request assigned',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                    <h2 style="color: #2950bb;">New Request Assigned</h2>
                    <p>Hello,</p>
                    <p>Department progress for trial <strong>${trial_id}</strong> has been assigned to you by <strong>${user.username}</strong>.</p>
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
        return "Department progress updated successfully";
    } else {
        const [rows] = await trx.query(
            `SELECT df2.department_id AS next_department_id
                FROM department_flow df1
                JOIN department_flow df2
                ON df2.sequence_no = df1.sequence_no + 1
                WHERE df1.department_id = @currentDepartmentId`,
            { currentDepartmentId: currentDepartment[0].department_id }
        );

        if (!rows || rows.length === 0) {
            throw new CustomError("Next department not found in flow.");
        }
        const next_department_id = rows[0].next_department_id;

        return await assignToNextDepartmentUser(trial_id, next_department_id, user, trx);
    }
};

export const approveProgress = async (trial_id, user, trx) => {
    await trx.query(
        `UPDATE department_progress SET approval_status = 'approved' WHERE trial_id = @trial_id`,
        { trial_id }
    );
    await generateAndStoreReport(trial_id);
    await updateTrialStatus(trial_id, 'CLOSED', user, trx);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress approved',
        remarks: `Department progress for trial ${trial_id} approved by ${user.username}`
    });
    return "Department progress approved successfully";
};