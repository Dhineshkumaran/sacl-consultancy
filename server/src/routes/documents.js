import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as documentsController from '../controllers/documents.js';

const router = express.Router();

router.post('/', verifyToken, asyncErrorHandler(documentsController.uploadDocument));
router.get('/', verifyToken, asyncErrorHandler(documentsController.getDocuments));

export default router;
