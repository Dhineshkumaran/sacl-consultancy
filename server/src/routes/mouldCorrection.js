import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as mouldCorrectionController from '../controllers/mouldCorrection.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 6), asyncErrorHandler(mouldCorrectionController.createCorrection));
router.put('/', verifyToken, authorizeDepartments(1, 6), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(mouldCorrectionController.updateCorrection));
router.get('/', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrectionByTrialId));

export default router;