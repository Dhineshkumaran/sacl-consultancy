import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

router.get('/dashboard', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { role, username, department_id } = req.query;
    const userId = req.user.user_id;
    const userDepartmentId = req.user.department_id;

    let stats = [];

    if (role === 'HOD') {
        const [completedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress approved' 
             AND al.action_timestamp >= DATEADD(year, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedLastYear = completedLastYearResult[0].count;

        const [completedLastMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress approved' 
             AND al.action_timestamp >= DATEADD(month, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedLastMonth = completedLastMonthResult[0].count;

        const [pendingCardsResult] = await Client.query(
            `SELECT COUNT(*) as count 
             FROM department_progress 
             WHERE username = @username 
             AND approval_status = 'pending'`,
            { username }
        );
        const pendingCards = pendingCardsResult[0].count;

        stats = [
            { label: 'Completed (Last Year)', value: completedLastYear.toString(), color: '#28a745', description: 'Trials completed in last 12 months' },
            { label: 'Completed (Last Month)', value: completedLastMonth.toString(), color: '#20c997', description: 'Trials completed in last 30 days' },
            { label: 'Pending Cards', value: pendingCards.toString(), color: '#ffc107', description: 'Trials awaiting completion' }
        ];
    }
    else if (role === 'User') {
        const [completedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress completed' 
             AND al.action_timestamp >= DATEADD(year, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedLastYear = completedLastYearResult[0].count;

        const [completedLastMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress completed' 
             AND al.action_timestamp >= DATEADD(month, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const completedLastMonth = completedLastMonthResult[0].count;

        const [pendingCardsResult] = await Client.query(
            `SELECT COUNT(*) as count 
             FROM department_progress 
             WHERE username = @username 
             AND approval_status = 'pending'`,
            { username }
        );
        const pendingCards = pendingCardsResult[0].count;

        stats = [
            { label: 'Completed (Last Year)', value: completedLastYear.toString(), color: '#28a745', description: 'Trials completed in last 12 months' },
            { label: 'Completed (Last Month)', value: completedLastMonth.toString(), color: '#20c997', description: 'Trials completed in last 30 days' },
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
        const [initiatedLastYearResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress added' 
             AND al.action_timestamp >= DATEADD(year, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const initiatedLastYear = initiatedLastYearResult[0].count;

        const [initiatedLastMonthResult] = await Client.query(
            `SELECT COUNT(DISTINCT al.trial_id) as count 
             FROM audit_log al
             WHERE al.department_id = @department_id
             AND al.action = 'Department progress added' 
             AND al.action_timestamp >= DATEADD(month, -1, GETDATE())`,
            { department_id: userDepartmentId }
        );
        const initiatedLastMonth = initiatedLastMonthResult[0].count;

        stats = [
            { label: 'Initiated (Last Year)', value: initiatedLastYear.toString(), color: '#28a745', description: 'Trials initiated in last 12 months' },
            { label: 'Initiated (Last Month)', value: initiatedLastMonth.toString(), color: '#20c997', description: 'Trials initiated in last 30 days' },
        ];
    }

    res.status(200).json({
        success: true,
        data: { stats }
    });
}));

export default router;
