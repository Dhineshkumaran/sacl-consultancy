import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';

const router = express.Router();

// Get all departments
router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [departments] = await Client.query(
        `SELECT department_id, department_name FROM departments ORDER BY department_id`
    );
    res.status(200).json({
        success: true,
        data: departments || []
    });
}));

export default router;

// API: http://localhost:3000/departments
// Method: GET
// Response: 
// {
//     "success": true,
//     "data": [
//         {
//             "department_id": 1,
//             "department_name": "Department 1"
//         },
//         {
//             "department_id": 2,
//             "department_name": "Department 2"
//         }
//     ]
// }