import path from 'path';
import { fileURLToPath } from 'url';
import CustomError from '../utils/customError.js';
import sendMail from '../utils/mailSender.js';
import { generateAndStoreTrialReport } from './trialReportGenerator.js';
import { generateAndStoreConsolidatedReport } from './consolidatedReportGenerator.js';

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
        `UPDATE department_progress SET completed_at = @completed_at, approval_status = @approval_status, remarks = @remarks WHERE department_id = @department_id AND trial_id = @trial_id AND approval_status = 'pending'`,
        { department_id: current_department_id, trial_id, completed_at: new Date(), approval_status: 'approved', remarks: `Approved by ${user.role}` }
    );

    const audit_sql_completion = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_completion, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress approved',
        remarks: `Department progress for trial ${trial_id} approved by ${user.username} at ${user.department_name} department`
    });

    const [pending] = await trx.query(
        `SELECT TOP 1 df.department_id FROM department_flow df
        JOIN department_progress dp ON dp.department_id = df.department_id
        WHERE dp.trial_id = @trial_id AND dp.approval_status = 'pending'
        ORDER BY df.sequence_no`,
        { trial_id }
    );

    if (pending && pending.length > 0) {
        await trx.query(
            `UPDATE trial_cards SET current_department_id = @pending_department_id, status = 'IN_PROGRESS' WHERE trial_id = @trial_id`,
            { pending_department_id: pending[0].department_id, trial_id }
        );
        return;
    }

    const [existingProgress] = await trx.query(
        `SELECT 1 FROM department_progress WHERE trial_id = @trial_id AND department_id = @next_department_id`,
        { trial_id, next_department_id }
    );

    if (existingProgress && existingProgress.length > 0) {
        return;
    }

    let next_department_user_result;
    if (next_department_id == 8) {
        if (trial_type == 'MACHINING - CUSTOMER END') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = 9 AND role = 'User' AND is_active = 1`,
            );
        } else if (trial_type == 'INHOUSE MACHINING(NPD)') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'NPD'`,
                { next_department_id }
            );
        } else if (trial_type == 'INHOUSE MACHINING(REGULAR)') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'REGULAR'`,
                { next_department_id }
            );
        }
    } else {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1`,
            { next_department_id }
        );
    }
    const [next_department_user_rows] = next_department_user_result;

    if (!next_department_user_rows || next_department_user_rows.length === 0) {
        throw new CustomError("No active user found for the next department");
    }

    const next_department_username = next_department_user_rows[0].username;

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
        to: next_department_user_rows[0].email,

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
    await sendMail(mailOptions);
    return "Department progress added successfully";
};

export const updateDepartment = async (trial_id, user, trx) => {
    const [current_trial] = await trx.query(
        `SELECT trial_type FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );

    const current_department_id = user.department_id;
    const trial_type = current_trial[0].trial_type;

    await trx.query(
        `UPDATE department_progress SET completed_at = @completed_at, approval_status = @approval_status, remarks = @remarks WHERE department_id = @department_id AND trial_id = @trial_id AND approval_status = 'pending'`,
        { department_id: current_department_id, trial_id, completed_at: new Date(), approval_status: 'approved', remarks: `Approved by ${user.role}` }
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
        `SELECT TOP 1 df.department_id FROM department_flow df WHERE 
             NOT EXISTS (SELECT 1 FROM department_progress dp 
             WHERE dp.department_id = df.department_id 
             AND dp.trial_id = @trial_id)
         ORDER BY df.sequence_no`,
        { trial_id }
    );

    if (!rows || rows.length === 0) {
        return await approveProgress(trial_id, user, trx);
    }

    const next_department_id = rows[0].department_id;

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
    const [current_trial] = await trx.query(
        `SELECT trial_type FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    const current_department_id = user.department_id;
    const trial_type = current_trial[0].trial_type;

    let current_department_hod_result;
    if (current_department_id == 8) {
        if (trial_type == 'MACHINING - CUSTOMER END') {
            current_department_hod_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = 9 AND role = 'HOD' AND is_active = 1`,
            );
        } else if (trial_type == 'INHOUSE MACHINING(NPD)') {
            current_department_hod_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1 AND machine_shop_user_type = 'NPD'`,
                { current_department_id }
            );
        } else if (trial_type == 'INHOUSE MACHINING(REGULAR)') {
            current_department_hod_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @current_department_id AND role = 'HOD' AND is_active = 1 AND machine_shop_user_type = 'REGULAR'`,
                { current_department_id }
            );
        }
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
            `UPDATE department_progress SET username = @current_department_hod_username, remarks = 'HOD approval pending', approval_status = 'pending' WHERE department_id = @department_id AND trial_id = @trial_id AND approval_status = 'pending'`,
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
        await sendMail(mailOptions);
        return "Department progress updated successfully";
    } else {
        const [rows] = await trx.query(
            `SELECT TOP 1 df.department_id FROM department_flow df WHERE 
                NOT EXISTS (SELECT 1 FROM department_progress dp 
                WHERE dp.department_id = df.department_id 
                AND dp.trial_id = @trial_id)
            ORDER BY df.sequence_no`,
            { trial_id }
        );

        if (!rows || rows.length === 0) {
            return await approveProgress(trial_id, user, trx);
        }

        const next_department_id = rows[0].department_id;

        return await assignToNextDepartmentUser(current_department_id, trial_id, trial_type, next_department_id, user, trx);
    }
};

export const approveProgress = async (trial_id, user, trx) => {
    await trx.query(
        `UPDATE department_progress SET approval_status = 'approved' WHERE trial_id = @trial_id AND approval_status = 'pending'`,
        { trial_id }
    );
    await trx.query(
        `UPDATE trial_cards SET status = 'CLOSED' WHERE trial_id = @trial_id`,
        { trial_id }
    );
    await generateAndStoreTrialReport(trial_id, trx);
    const [pattern_code_result] = await trx.query(
        `SELECT pattern_code FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    if (pattern_code_result && pattern_code_result.length > 0) {
        const pattern_code = pattern_code_result[0].pattern_code;
        await generateAndStoreConsolidatedReport(pattern_code, trx);
    }
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress completed',
        remarks: `Department progress for trial ${trial_id} completed by ${user.username} and trial is closed`
    });
    return "Department progress completed successfully";
};

export const triggerNextDepartment = async (trial_id, user, trx) => {
    const current_department_id = user.department_id;

    const [trialData] = await trx.query(
        `SELECT trial_type FROM trial_cards WHERE trial_id = @trial_id`,
        { trial_id }
    );
    const trial_type = trialData[0]?.trial_type;

    const [rows] = await trx.query(
        `SELECT df2.department_id AS next_department_id
            FROM department_flow df1
            JOIN department_flow df2
            ON df2.sequence_no = df1.sequence_no + 1
            WHERE df1.department_id = @currentDepartmentId`,
        { currentDepartmentId: current_department_id }
    );

    if (!rows || rows.length === 0) {
        return "No next department found";
    }

    const next_department_id = rows[0].next_department_id;

    const [existingProgress] = await trx.query(
        `SELECT 1 FROM department_progress WHERE trial_id = @trial_id AND department_id = @next_department_id`,
        { trial_id, next_department_id }
    );

    if (existingProgress && existingProgress.length > 0) {
        return "Next department progress already exists";
    }

    let next_department_user_result;
    if (next_department_id == 8) {
        if (trial_type == 'MACHINING - CUSTOMER END') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = 9 AND role = 'User' AND is_active = 1`,
            );
        } else if (trial_type == 'INHOUSE MACHINING(NPD)') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'NPD'`,
                { next_department_id }
            );
        } else if (trial_type == 'INHOUSE MACHINING(REGULAR)') {
            next_department_user_result = await trx.query(
                `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1 AND machine_shop_user_type = 'REGULAR'`,
                { next_department_id }
            );
        }
    } else {
        next_department_user_result = await trx.query(
            `SELECT TOP 1 * FROM users WHERE department_id = @next_department_id AND role = 'User' AND is_active = 1`,
            { next_department_id }
        );
    }
    const [next_department_user] = next_department_user_result;

    if (!next_department_user) {
        throw new CustomError("No user found for the next department");
    }

    const next_department_username = next_department_user[0].username;

    await trx.query(
        `INSERT INTO department_progress (department_id, username, remarks, approval_status, trial_id) VALUES (@next_department_id, @next_department_username, 'User submission pending', 'pending', @trial_id)`,
        { next_department_id, next_department_username, trial_id }
    );

    const audit_sql_assignment = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql_assignment, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Department progress updated (Draft)',
        remarks: `Next department updated by draft save by ${user.username}`
    });

    const mailOptions = {
        to: next_department_user[0].email,
        subject: 'A new request assigned',
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <img src="cid:sacllogo" alt="SACL Logo" style="max-width: 200px; margin-bottom: 20px;" />
                <h2 style="color: #2950bb;">New Request Assigned</h2>
                <p>Hello,</p>
                <p>The trial <strong>${trial_id}</strong> has been partially completed and assigned to you by <strong>${user.username}</strong>.</p>
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
    await sendMail(mailOptions);
    return "Next department updated successfully";
};
