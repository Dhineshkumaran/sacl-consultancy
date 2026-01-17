import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as statsController from '../controllers/stats.js';

const router = express.Router();

router.get('/dashboard', verifyToken, asyncErrorHandler(statsController.getDashboardStats));

export default router;
