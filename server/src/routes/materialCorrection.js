import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as materialCorrectionController from '../controllers/materialCorrection.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import { validate } from '../middlewares/validate.js';
import { materialCorrectionSchema, updateMaterialCorrectionSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 3), validate(materialCorrectionSchema), asyncErrorHandler(materialCorrectionController.createMaterialCorrection));
router.put('/', verifyToken, authorizeDepartments(1, 3), authorizeRoles('Admin', 'HOD'), validate(updateMaterialCorrectionSchema), asyncErrorHandler(materialCorrectionController.updateMaterialCorrection));
router.get('/', verifyToken, asyncErrorHandler(materialCorrectionController.getMaterialCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(materialCorrectionController.getMaterialCorrectionByTrialId));

export default router;