import Client from '../config/connection.js';

export const getProgress = async (req, res, next) => {
    const username = req.query.username;
    const [result] = await Client.query(
        `SELECT department_progress.*, departments.department_name, t.part_name, t.pattern_code, t.disa, t.date_of_sampling FROM department_progress 
         JOIN departments ON department_progress.department_id = departments.department_id 
         JOIN trial_cards t ON department_progress.trial_id = t.trial_id 
         WHERE t.deleted_at IS NULL AND department_progress.username = @username AND department_progress.approval_status = 'pending'`,
        { username }
    );
    res.status(200).json({
        success: true,
        data: result
    });
};

export const getCompletedTrials = async (req, res, next) => {
    const [result] = await Client.query(
        `SELECT DISTINCT 
            dp.trial_id,
            dp.department_id,
            dp.completed_at,
            dp.remarks,
            d.department_name,
            t.part_name,
            t.pattern_code,
            t.disa,
            t.date_of_sampling,
            t.status
         FROM department_progress dp
         JOIN trial_cards t ON dp.trial_id = t.trial_id
         JOIN departments d ON dp.department_id = d.department_id
         WHERE t.deleted_at IS NULL AND dp.department_id = @department_id 
         AND (dp.approval_status = 'approved')
         ORDER BY dp.completed_at DESC`,
        { department_id: req.user.department_id }
    );

    res.status(200).json({
        success: true,
        data: result
    });
};

export const getProgressByTrialId = async (req, res, next) => {
    const trial_id = req.query.trial_id;
    const [result] = await Client.query(
        `SELECT dp.*, d.department_name FROM department_progress dp JOIN departments d ON dp.department_id = d.department_id WHERE dp.trial_id = @trial_id AND dp.approval_status = 'approved';`,
        { trial_id }
    );
    res.status(200).json({
        success: true,
        data: result
    });
};
export const toggleApprovalStatus = async (req, res, next) => {
    const { trial_id, department_id } = req.body;
    
    const [current] = await Client.query(
        `SELECT approval_status FROM department_progress WHERE trial_id = @trial_id AND department_id = @department_id`,
        { trial_id, department_id }
    );

    if (!current || current.length === 0) {
        return res.status(404).json({ success: false, message: 'Progress record not found' });
    }

    const newStatus = current[0].approval_status === 'pending' ? 'approved' : 'pending';
    
    await Client.query(
        `UPDATE department_progress SET approval_status = @newStatus WHERE trial_id = @trial_id AND department_id = @department_id`,
        { newStatus, trial_id, department_id }
    );

    await Client.query(
        `INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)`,
        { 
            user_id: req.user.user_id, 
            department_id: req.user.department_id, 
            trial_id, 
            action: 'Approval Status Toggled', 
            remarks: `Status changed to ${newStatus} by Admin`
        }
    );

    res.status(200).json({ success: true, message: `Status updated to ${newStatus}` });
};
