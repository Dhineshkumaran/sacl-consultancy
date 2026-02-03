import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as machineShopController from '../controllers/machineShop.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import { validate } from '../middlewares/validate.js';
import validateTrial from '../middlewares/validateTrial.js';
import { machineShopSchema, updateMachineShopSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, validateTrial, authorizeDepartments(1, 8, 9), validate(machineShopSchema), asyncErrorHandler(machineShopController.createMachineShop));
router.put('/', verifyToken, validateTrial, authorizeDepartments(1, 8, 9), validate(updateMachineShopSchema), asyncErrorHandler(machineShopController.updateMachineShop));
router.get('/', verifyToken, asyncErrorHandler(machineShopController.getMachineShops));
router.get('/trial_id', verifyToken, asyncErrorHandler(machineShopController.getMachineShopByTrialId));

export default router;
