import express from 'express';
import * as userController from '../controllers/users.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import verifyToken from '../utils/verifyToken.js';

import authorizeRoles from '../utils/authorizeRoles.js';

const router = express.Router();

router.get('/', verifyToken, asyncErrorHandler(userController.getAllUsers));
router.post('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(userController.createUser));
router.delete('/:userId', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(userController.deleteUser));
router.post('/send-otp', verifyToken, asyncErrorHandler(userController.sendOtp));
router.post('/verify-otp', verifyToken, asyncErrorHandler(userController.verifyOtp));
router.post('/change-password', verifyToken, asyncErrorHandler(userController.changePassword));
router.post('/update-username', verifyToken, asyncErrorHandler(userController.updateUsername));
router.post('/change-status', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(userController.changeStatus));
router.post('/profile-photo', verifyToken, asyncErrorHandler(userController.uploadProfilePhoto));
router.get('/profile-photo', verifyToken, asyncErrorHandler(userController.getProfilePhoto));
router.put('/:userId', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(userController.adminUpdateUser));

export default router;
