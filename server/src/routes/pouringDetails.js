import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as pouringDetailsController from '../controllers/pouringDetails.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 7), asyncErrorHandler(pouringDetailsController.createPouringDetails));
router.put('/', verifyToken, authorizeDepartments(1, 7), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(pouringDetailsController.updatePouringDetails));
router.get('/', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetails));
router.get('/trial_id', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetailsByTrialId));

export default router;