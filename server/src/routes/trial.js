import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as trialController from '../controllers/trial.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 2), asyncErrorHandler(trialController.createTrial));
router.get('/', verifyToken, asyncErrorHandler(trialController.getTrials));
router.get('/trial_id', verifyToken, asyncErrorHandler(trialController.getTrialById));
router.get('/id', verifyToken, asyncErrorHandler(trialController.generateTrialId));
router.get('/trial-reports', verifyToken, asyncErrorHandler(trialController.getTrialReports));
router.put('/update', verifyToken, authorizeDepartments(1, 2), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(trialController.updateTrial));
router.delete('/delete-reports', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(trialController.deleteTrialReports));

export default router;