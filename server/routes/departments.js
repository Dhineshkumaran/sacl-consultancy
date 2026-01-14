import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as departmentsController from '../controllers/departments.js';

const router = express.Router();

router.get('/', verifyToken, asyncErrorHandler(departmentsController.getAllDepartments));

export default router;