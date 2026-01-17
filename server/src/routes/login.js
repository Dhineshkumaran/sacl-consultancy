import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import * as loginController from '../controllers/login.js';

const router = express.Router();

router.post('/', asyncErrorHandler(loginController.login));
router.post('/refresh-token', asyncErrorHandler(loginController.refreshToken));

export default router;