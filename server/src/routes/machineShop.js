import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as machineShopController from '../controllers/machineShop.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import { validate } from '../middlewares/validate.js';
import { machineShopSchema, updateMachineShopSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 8), validate(machineShopSchema), asyncErrorHandler(machineShopController.createMachineShop));
router.put('/', verifyToken, authorizeDepartments(1, 8), authorizeRoles('Admin', 'HOD'), validate(updateMachineShopSchema), asyncErrorHandler(machineShopController.updateMachineShop));
router.get('/', verifyToken, asyncErrorHandler(machineShopController.getMachineShops));
router.get('/trial_id', verifyToken, asyncErrorHandler(machineShopController.getMachineShopByTrialId));

export default router;