import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as departmentProgressController from '../controllers/departmentProgress.js';

const router = express.Router();

router.get('/get-progress', verifyToken, asyncErrorHandler(departmentProgressController.getProgress));
router.get('/get-completed-trials', verifyToken, asyncErrorHandler(departmentProgressController.getCompletedTrials));
router.get('/get-progress-by-trial-id', verifyToken, asyncErrorHandler(departmentProgressController.getProgressByTrialId));
router.post('/toggle-approval-status', verifyToken, asyncErrorHandler(departmentProgressController.toggleApprovalStatus));

export default router;