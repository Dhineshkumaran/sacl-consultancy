import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as visualInspectionController from '../controllers/visualInspection.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import { validate } from '../middlewares/validate.js';
import { visualInspectionSchema, updateVisualInspectionSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 5), validate(visualInspectionSchema), asyncErrorHandler(visualInspectionController.createInspection));
router.put('/', verifyToken, authorizeDepartments(1, 5), authorizeRoles('Admin', 'HOD'), validate(updateVisualInspectionSchema), asyncErrorHandler(visualInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(visualInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(visualInspectionController.getInspectionByTrialId));

export default router;