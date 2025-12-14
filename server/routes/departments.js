import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

// Get all departments
router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const [departments] = await Client.query(
        `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );
    res.status(200).json({
        success: true,
        data: departments || []
    });
}));

export default router;