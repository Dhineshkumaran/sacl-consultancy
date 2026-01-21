import path from 'path';
import { fileURLToPath } from 'url';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';
import { generateAndStoreTrialReport } from './trialReportGenerator.js';
import { generateAndStoreConsolidatedReport } from './consolidatedReportGenerator.js';
import { updateTrialStatus } from './trial.js';

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
            remarks: `Department progress for trial ${trial_id} added by ${user.username} in ${user.department_name} department`
        });

    }
};

const assignToNextDepartmentUser = async (current_department_id, trial_id, trial_type, next_department_id, user, trx) => {
    await trx.query(
        `UPDATE department_progress SET completed_at = @completed_at, approval_status = @approval_status, remarks = @remarks WHERE department_id = @department_id AND trial_id = @trial_id`,
        { department_id: current_department_id, trial_id, completed_at: new Date(), approval_status: 'approved', remarks: `Approved by ${user.role}` }
    );

    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress completed',
        remarks: `Department progress for trial ${trial_id} completed by ${user.username} at ${user.department_name} department`
    });

    let next_department_user_result;
    if (next_department_id == 8 && trial_type == 'MACHINING - CUSTOMER END') {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = 9 AND role = 'User' AND is_active = 1`,
        );
    } else if (next_department_id == 8 && trial_type == 'INHOUSE MACHINING(NPD)') {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'NPD'`,
            { next_department_id }
        );
    } else if (next_department_id == 8 && trial_type == 'INHOUSE MACHINING(REGULAR)') {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'REGULAR'`,
            { next_department_id }
        );
    } else {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1`,
            { next_department_id }
        );
    }
    const [next_department_user] = next_department_user_result;

    if (!next_department_user) {
        throw new CustomError("No user found for the department/updating progress");
    }

    const next_department_username = next_department_user[0].username;

    await trx.query(
        `INSERT INTO department_progress (department_id, username, remarks, approval_status, trial_id) VALUES (@next_department_id, @next_department_username, 'User submission pending', 'pending', @trial_id)`,
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
        action: 'Department progress added',
        remarks: `Department progress for trial ${trial_id} added by ${user.username} in ${user.department_name} department`
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
            filename: 'SACL-LOGO.jpg',
            path: path.resolve(__dirname, '../../assets/SACL-LOGO.jpg'),
            cid: 'sacllogo'
        }]
    };
    await transporter.sendMail(mailOptions);
    return "Department progress added successfully";
};

export const updateDepartment = async (trial_id, user, trx) => {
    const [currentDepartment] = await trx.query(
        `SELECT current_department_id, trial_type FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );

    const current_department_id = currentDepartment[0].current_department_id;
    const trial_type = currentDepartment[0].trial_type;

    await trx.query(
        `UPDATE department_progress SET completed_at = @completed_at, approval_status = @approval_status, remarks = @remarks WHERE department_id = @department_id AND trial_id = @trial_id`,
        { department_id: current_department_id, trial_id, completed_at: new Date(), approval_status: 'approved', remarks: `Approved by HOD` }
    );

    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress approved',
        remarks: `Department progress for trial ${trial_id} approved by ${user.username} at ${user.department_name} department`
    });

    const [rows] = await trx.query(
        `SELECT df2.department_id AS next_department_id
            FROM department_flow df1
            JOIN department_flow df2
            ON df2.sequence_no = df1.sequence_no + 1
            WHERE df1.department_id = @currentDepartmentId`,
        { currentDepartmentId: current_department_id }
    );

    if (!rows || rows.length === 0) {
        await approveProgress(current_department_id, trial_id, user, trx);
        return;
    }
    const next_department_id = rows[0].next_department_id;

    return await assignToNextDepartmentUser(current_department_id, trial_id, trial_type, next_department_id, user, trx);
};

export const updateRole = async (trial_id, user, trx) => {
    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress updated',
        remarks: `Department progress for trial ${trial_id} updated by ${user.username} in ${user.department_name} department`
    });
    const [currentDepartment] = await trx.query(
        `SELECT current_department_id, trial_type FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    const current_department_id = currentDepartment[0].current_department_id;
    const trial_type = currentDepartment[0].trial_type;

    let current_department_hod_result;
    if (current_department_id == 8 && trial_type == 'MACHINING - CUSTOMER END') {
        current_department_hod_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = 9 AND role = 'HOD' AND is_active = 1`,
        );
    } else if (current_department_id == 8 && trial_type == 'INHOUSE MACHINING(NPD)') {
        current_department_hod_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1 AND machine_shop_user_type = 'NPD'`,
            { current_department_id }
        );
    } else if (current_department_id == 8 && trial_type == 'INHOUSE MACHINING(REGULAR)') {
        current_department_hod_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1 AND machine_shop_user_type = 'REGULAR'`,
            { current_department_id }
        );
    } else {
        current_department_hod_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1`,
            { current_department_id }
        );
    }

    const [current_department_hod] = current_department_hod_result;

    if (current_department_hod && current_department_hod.length > 0) {
        const current_department_hod_username = current_department_hod[0].username;
        await trx.query(
            `UPDATE department_progress SET username = @current_department_hod_username, remarks = 'HOD approval pending', approval_status = 'pending' WHERE department_id = @department_id AND trial_id = @trial_id`,
            { current_department_hod_username, department_id: current_department_id, trial_id }
        );
        const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql_assignment, {
            user_id: user.user_id,
            department_id: user.department_id,
            trial_id,
            action: 'Department progress updated',
            remarks: `Department progress for trial ${trial_id} updated by ${user.username} in ${user.department_name} department`
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
                filename: 'SACL-LOGO.jpg',
                path: path.resolve(__dirname, '../../assets/SACL-LOGO.jpg'),
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
            { currentDepartmentId: current_department_id }
        );

        if (!rows || rows.length === 0) {
            await approveProgress(current_department_id, trial_id, user, trx);
            return;
        }
        const next_department_id = rows[0].next_department_id;

        return await assignToNextDepartmentUser(current_department_id, trial_id, trial_type, next_department_id, user, trx);
    }
};

export const approveProgress = async (department_id, trial_id, user, trx) => {
    await trx.query(
        `UPDATE department_progress SET approval_status = 'approved', completed_at = @completed_at, remarks = @remarks WHERE department_id = @department_id AND trial_id = @trial_id`,
        { department_id, trial_id, completed_at: new Date(), remarks: `Approved by ${user.role}` }
    );
    await generateAndStoreTrialReport(trial_id, trx);
    await generateAndStoreConsolidatedReport(trial_id, trx);
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