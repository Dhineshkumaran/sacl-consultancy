import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as dimensionalInspectionController from '../controllers/dimensionalInspection.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 10), asyncErrorHandler(dimensionalInspectionController.createInspection));
router.put('/', verifyToken, authorizeDepartments(1, 10), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(dimensionalInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(dimensionalInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(dimensionalInspectionController.getInspectionByTrialId));

export default router;