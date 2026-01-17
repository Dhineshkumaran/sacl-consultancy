export const updateTrialStatus = async (trial_id, status, user, trx) => {
    if (!trial_id || !status) {
        throw new Error('Trial ID and status are required');
    }
    await trx.query("UPDATE trial_cards SET status = @status WHERE trial_id = @trial_id", { status, trial_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
    await trx.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        trial_id,
        action: 'Trial updated',
        remarks: `Trial ${trial_id} updated by ${user.username} as ${status}`
    });

};