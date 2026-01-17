import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as sandPropertiesController from '../controllers/sandProperties.js';
import authorizeDepartments from '../utils/authorizeDepartments.js';
import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.post('/', verifyToken, authorizeDepartments(1, 4), asyncErrorHandler(sandPropertiesController.createSandProperties));
router.put('/', verifyToken, authorizeDepartments(1, 4), authorizeRoles('Admin', 'HOD'), asyncErrorHandler(sandPropertiesController.updateSandProperties));
router.get('/', verifyToken, asyncErrorHandler(sandPropertiesController.getSandProperties));
router.get('/trial_id', verifyToken, asyncErrorHandler(sandPropertiesController.getSandPropertiesByTrialId));

export default router;