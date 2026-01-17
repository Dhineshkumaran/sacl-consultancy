import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import * as forgotPasswordController from '../controllers/forgotPassword.js';

const router = express.Router();

router.post('/request-reset', asyncErrorHandler(forgotPasswordController.requestReset));
router.post('/reset-password', asyncErrorHandler(forgotPasswordController.resetPassword));

export default router;
