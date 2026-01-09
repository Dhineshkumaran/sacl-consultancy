import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as trialController from '../controllers/trial.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(trialController.createTrial));
router.get('/', verifyToken, asyncErrorHandler(trialController.getTrials));
router.get('/trial_id', verifyToken, asyncErrorHandler(trialController.getTrialById));
router.get('/id', verifyToken, asyncErrorHandler(trialController.generateTrialId));
router.put('/update-status', verifyToken, asyncErrorHandler(trialController.updateTrialStatus));
router.put('/update', verifyToken, asyncErrorHandler(trialController.updateTrial));
router.delete('/delete', verifyToken, asyncErrorHandler(trialController.deleteTrialReports));

export default router;