import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as trialController from '../controllers/trial.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import { validate } from '../middlewares/validate.js';
import { trialCardSchema, updateTrialCardSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 2), validate(trialCardSchema), asyncErrorHandler(trialController.createTrial));
router.get('/', verifyToken, asyncErrorHandler(trialController.getTrials));
router.get('/trial_id', verifyToken, asyncErrorHandler(trialController.getTrialById));
router.get('/id', verifyToken, asyncErrorHandler(trialController.generateTrialId));
router.get('/trial-reports', verifyToken, asyncErrorHandler(trialController.getTrialReports));
router.get('/recent-trial-reports', verifyToken, asyncErrorHandler(trialController.getRecentTrialReports));
router.get('/consolidated-reports', verifyToken, asyncErrorHandler(trialController.getConsolidatedReports));
router.put('/update', verifyToken, authorizeDepartments(1, 2), authorizeRoles('Admin', 'HOD'), validate(updateTrialCardSchema), asyncErrorHandler(trialController.updateTrial));
router.delete('/delete-reports', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(trialController.deleteTrialReports));
router.get('/deleted-reports', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(trialController.getDeletedTrialReports));
router.post('/restore-report', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(trialController.restoreTrialReport));
router.delete('/permanent-delete-report', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(trialController.permanentlyDeleteTrialReport));

export default router;