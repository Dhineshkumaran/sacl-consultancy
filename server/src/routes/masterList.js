import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../middlewares/verifyToken.js';
import * as masterListController from '../controllers/masterList.js';
import { validate } from '../middlewares/validate.js';
import { masterCardSchema, updateMasterCardSchema } from '../schemas/index.js';

const router = express.Router();

router.get('/search', verifyToken, asyncErrorHandler(masterListController.getMasterByPatternCode));
router.get('/', verifyToken, asyncErrorHandler(masterListController.getMasterList));
router.post('/', verifyToken, validate(masterCardSchema), asyncErrorHandler(masterListController.createMasterList));
router.put('/toggle-status', verifyToken, asyncErrorHandler(masterListController.toggleMasterListStatus));
router.put('/:id', verifyToken, validate(updateMasterCardSchema), asyncErrorHandler(masterListController.updateMasterList));
router.delete('/bulk', verifyToken, asyncErrorHandler(masterListController.bulkDeleteMasterList));

export default router;
