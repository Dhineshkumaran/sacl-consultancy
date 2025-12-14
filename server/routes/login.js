import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import CustomError from '../utils/customError.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

const generateToken = (user_id, username, department_id = null, role = null) => {
    const payload = {
        user_id,
        username,
        department_id,
        role,
        iat: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

const generateRefreshToken = (user_id, username) => {
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh');
    return jwt.sign({ user_id, username }, refreshSecret, { expiresIn: '7d' });
};

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { username, password } = req.body || {};
    console.log(req.body);

    if (!username || !password) {
        return next(new CustomError('Username and password are required', 400));
    }

    try {
        const [rows] = await Client.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);

        if (!rows || rows.length === 0) {
            return next(new CustomError('Invalid credentials', 401));
        }

        let user = rows[0];
        const departmentQuery = `SELECT department_name FROM departments WHERE department_id = ? LIMIT 1`;
        if (user.department_id) {
            const [deptRows] = await Client.query(departmentQuery, [user.department_id]);
            if (deptRows && deptRows.length > 0) {
                user.department = deptRows[0].department_name;
            } else {
                return next(new CustomError('Invalid department', 400));
            }
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return next(new CustomError('Invalid credentials', 401));
        }

        const token = generateToken(user.user_id, user.username, user.department_id, user.role);
        const refreshToken = generateRefreshToken(user.user_id, user.username);

        const needsEmailVerification = !user.email;
        const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'sacl123';
        const needsPasswordChange = await bcrypt.compare(DEFAULT_PASSWORD, user.password_hash);

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
        const [audit_result] = await Client.query(audit_sql, [user.user_id, user.department_id, 'Login', `User ${user.username} logged in with IP ${req.ip}`]);

        return res.status(200).json({
            success: true,
            token,
            refreshToken,
            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                department_id: user.department_id,
                department: user.department,
                role: user.role
            },
            needsEmailVerification,
            needsPasswordChange,
            expiresIn: '24h',
            message: `Login successful as ${user.role}`
        });

    } catch (err) {
        return next(new CustomError('Server error during login', 500));
    }
}));

router.post('/refresh-token', asyncErrorHandler(async (req, res, next) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET || (process.env.JWT_SECRET + '_refresh');
    let payload;
    try {
        payload = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { user_id, username } = payload;
    const newToken = generateToken(user_id, username);
    return res.json({ success: true, token: newToken });
}));

export default router;