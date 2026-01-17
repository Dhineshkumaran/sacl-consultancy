import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as machineShopController from '../controllers/machineShop.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 8), asyncErrorHandler(machineShopController.createMachineShop));
router.put('/', verifyToken, authorizeDepartments(1, 8), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(machineShopController.updateMachineShop));
router.get('/', verifyToken, asyncErrorHandler(machineShopController.getMachineShops));
router.get('/trial_id', verifyToken, asyncErrorHandler(machineShopController.getMachineShopByTrialId));

export default router;