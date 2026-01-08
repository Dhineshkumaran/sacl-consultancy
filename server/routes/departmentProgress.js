import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as departmentProgressController from '../controllers/departmentProgress.js';

const router = express.Router();

router.get('/get-progress', verifyToken, asyncErrorHandler(departmentProgressController.getProgress));
router.get('/get-completed-trials', verifyToken, asyncErrorHandler(departmentProgressController.getCompletedTrials));

export default router;