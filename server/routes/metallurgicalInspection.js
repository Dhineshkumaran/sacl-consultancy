import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as metallurgicalInspectionController from '../controllers/metallurgicalInspection.js';
import authorizeDepartment from '../utils/authorizeDepartment.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartment(1, 9), asyncErrorHandler(metallurgicalInspectionController.createInspection));
router.put('/', verifyToken, authorizeDepartment(1, 9), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(metallurgicalInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(metallurgicalInspectionController.getInspectionByTrialId));

export default router;