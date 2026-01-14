import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as visualInspectionController from '../controllers/visualInspection.js';
import authorizeRoles from '../utils/authorizeRoles.js';
import authorizeDepartment from '../utils/authorizeDepartment.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartment(1, 5), asyncErrorHandler(visualInspectionController.createInspection));
router.put('/', verifyToken, authorizeDepartment(1, 5), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(visualInspectionController.updateInspection));
router.get('/', verifyToken, asyncErrorHandler(visualInspectionController.getInspections));
router.get('/trial_id', verifyToken, asyncErrorHandler(visualInspectionController.getInspectionByTrialId));

export default router;