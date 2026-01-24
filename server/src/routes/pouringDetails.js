import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as pouringDetailsController from '../controllers/pouringDetails.js';
import authorizeDepartments from '../middlewares/authorizeDepartments.js';
import authorizeRoles from '../middlewares/authorizeRoles.js';
import { validate } from '../middlewares/validate.js';
import { pouringDetailsSchema, updatePouringDetailsSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 7), validate(pouringDetailsSchema), asyncErrorHandler(pouringDetailsController.createPouringDetails));
router.put('/', verifyToken, authorizeDepartments(1, 7), authorizeRoles('Admin', 'HOD'), validate(updatePouringDetailsSchema), asyncErrorHandler(pouringDetailsController.updatePouringDetails));
router.get('/', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetails));
router.get('/trial_id', verifyToken, asyncErrorHandler(pouringDetailsController.getPouringDetailsByTrialId));

export default router;