import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import { createMaterialCorrection, updateMaterialCorrection, getMaterialCorrections, getMaterialCorrectionByTrialId } from '../controllers/materialCorrection.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 3), asyncErrorHandler(createMaterialCorrection));
router.put('/', verifyToken, authorizeDepartments(1, 3), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(updateMaterialCorrection));
router.get('/', verifyToken, asyncErrorHandler(getMaterialCorrections));
router.get('/trial_id', verifyToken, asyncErrorHandler(getMaterialCorrectionByTrialId));

export default router;