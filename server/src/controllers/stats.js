import Client from '../config/connection.js';

export const getDashboardStats = async (req, res, next) => {
    const { role, username, department_id } = req.query;
    const userId = req.user.user_id;
    const userDepartmentId = req.user.department_id;

    let stats = [];

    if (role === 'HOD') {
        const [completedCurrentYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress approved' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedCurrentYear = completedCurrentYearResult[0].count;

        const [completedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress approved' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE()) - 1`,
            { department_id: userDepartmentId }
        );
        const completedLastYear = completedLastYearResult[0].count;

        const [completedCurrentMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress approved' 
             AND MONTH(al.action_timestamp) = MONTH(GETDATE())
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedCurrentMonth = completedCurrentMonthResult[0].count;

        const [pendingCardsResult] = await Client.query(
            `SELECT COUNT(*) as count 
             FROM department_progress 
             WHERE username = @username 
             AND approval_status = 'pending'`,
            { username }
        );
        const pendingCards = pendingCardsResult[0].count;

        stats = [
            { label: `Completed (${new Date().getFullYear() - 1})`, value: completedLastYear.toString(), color: '#6c757d', description: 'Trials completed in previous year' },
            { label: `Completed (${new Date().getFullYear()})`, value: completedCurrentYear.toString(), color: '#28a745', description: 'Trials completed in current year' },
            { label: 'Completed (Current Month)', value: completedCurrentMonth.toString(), color: '#20c997', description: 'Trials completed in current month' },
            { label: 'Pending Cards', value: pendingCards.toString(), color: '#ffc107', description: 'Trials awaiting completion' }
        ];
    }
    else if (role === 'User') {
        const [completedCurrentYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress completed' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedCurrentYear = completedCurrentYearResult[0].count;

        const [completedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress completed' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE()) - 1`,
            { department_id: userDepartmentId }
        );
        const completedLastYear = completedLastYearResult[0].count;

        const [completedCurrentMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress completed' 
             AND MONTH(al.action_timestamp) = MONTH(GETDATE())
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedCurrentMonth = completedCurrentMonthResult[0].count;

        const [pendingCardsResult] = await Client.query(
            `SELECT COUNT(*) as count 
             FROM department_progress 
             WHERE username = @username 
             AND approval_status = 'pending'`,
            { username }
        );
        const pendingCards = pendingCardsResult[0].count;

        stats = [
            { label: `Completed (${new Date().getFullYear() - 1})`, value: completedLastYear.toString(), color: '#6c757d', description: 'Trials completed in previous year' },
            { label: `Completed (${new Date().getFullYear()})`, value: completedCurrentYear.toString(), color: '#28a745', description: 'Trials completed in current year' },
            { label: 'Completed (Current Month)', value: completedCurrentMonth.toString(), color: '#20c997', description: 'Trials completed in current month' },
            { label: 'Pending Cards', value: pendingCards.toString(), color: '#ffc107', description: 'Tasks awaiting review' }
        ];
    }

    if (req.query.statsType === 'admin_trials') {
        const [totalTrialsResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM trial_cards WHERE trial_id IS NOT NULL`
        );
        const totalTrials = totalTrialsResult[0].count;

        const [ongoingResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM trial_cards 
             WHERE trial_id IS NOT NULL 
             AND status = 'IN_PROGRESS'`
        );
        const ongoing = ongoingResult[0].count;

        const [approvedResult] = await Client.query(
            `SELECT COUNT(DISTINCT trial_id) as count FROM trial_cards   
             WHERE trial_id IS NOT NULL 
             AND status = 'CLOSED'`
        );
        const approved = approvedResult[0].count;

        stats = [
            { label: 'Total Trials', value: totalTrials.toString(), color: '#007bff' },
            { label: 'Ongoing', value: ongoing.toString(), color: '#17a2b8' },
            { label: 'Approved', value: approved.toString(), color: '#28a745' }
        ];
    }

    if (req.query.statsType === 'methods_dashboard') {
        const [initiatedCurrentYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress added' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const initiatedCurrentYear = initiatedCurrentYearResult[0].count;

        const [initiatedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress added' 
             AND YEAR(al.action_timestamp) = YEAR(GETDATE()) - 1`,
            { department_id: userDepartmentId }
        );
        const initiatedLastYear = initiatedLastYearResult[0].count;

        const [initiatedCurrentMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress added' 
             AND MONTH(al.action_timestamp) = MONTH(GETDATE())
             AND YEAR(al.action_timestamp) = YEAR(GETDATE())`,
            { department_id: userDepartmentId }
        );
        const initiatedCurrentMonth = initiatedCurrentMonthResult[0].count;

        stats = [
            { label: `Initiated (${new Date().getFullYear() - 1})`, value: initiatedLastYear.toString(), color: '#6c757d', description: 'Trials initiated in previous year' },
            { label: `Initiated (${new Date().getFullYear()})`, value: initiatedCurrentYear.toString(), color: '#28a745', description: 'Trials initiated in current year' },
            { label: 'Initiated (Current Month)', value: initiatedCurrentMonth.toString(), color: '#20c997', description: 'Trials initiated in current month' },
        ];
    }

    res.status(200).json({
        success: true,
        data: { stats }
    });
};
