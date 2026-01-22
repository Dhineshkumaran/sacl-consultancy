import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as mouldCorrectionController from '../controllers/mouldCorrection.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import { validate } from '../middlewares/validate.js';
import { mouldCorrectionSchema, updateMouldCorrectionSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 6), validate(mouldCorrectionSchema), asyncErrorHandler(mouldCorrectionController.createCorrection));
router.put('/', verifyToken, authorizeDepartments(1, 6), authorizeRoles('Admin', 'HOD'), validate(updateMouldCorrectionSchema), asyncErrorHandler(mouldCorrectionController.updateCorrection));
router.get('/', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(mouldCorrectionController.getCorrectionByTrialId));

export default router;