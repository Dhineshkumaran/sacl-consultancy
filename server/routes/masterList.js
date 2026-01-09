import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';
import * as masterListController from '../controllers/masterList.js';

const router = express.Router();

router.get('/search', verifyToken, asyncErrorHandler(masterListController.getMasterByPatternCode));
router.get('/', verifyToken, asyncErrorHandler(masterListController.getMasterList));
router.post('/', verifyToken, asyncErrorHandler(masterListController.createMasterList));
router.put('/:id', verifyToken, asyncErrorHandler(masterListController.updateMasterList));
router.delete('/bulk', verifyToken, asyncErrorHandler(masterListController.bulkDeleteMasterList));
router.put('/toggle-status', verifyToken, asyncErrorHandler(masterListController.toggleMasterListStatus));

export default router;
