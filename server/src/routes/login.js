import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import * as loginController from '../controllers/login.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/', validate(loginSchema), asyncErrorHandler(loginController.login));
router.post('/refresh-token', asyncErrorHandler(loginController.refreshToken));

export default router;