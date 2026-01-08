export const updateTrialStatusService = async (trial_id, status, user, client = Client) => {
    if (!trial_id || !status) {
        throw new Error('trial_id and status are required');
    }
    await client.query("UPDATE trial_cards SET status = @status WHERE trial_id = @trial_id", { status, trial_id });

    const userId = user?.user_id || null;
    const departmentId = user?.department_id || null;
    const username = user?.username || 'System';

    if (userId) {
        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await client.query(audit_sql, {
            user_id: userId,
            department_id: departmentId,
            trial_id,
            action: 'Trial updated',
            remarks: `Trial ${trial_id} updated by ${username} as ${status}`
        });
    }
    return true;
};