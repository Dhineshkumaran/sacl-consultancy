import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import jwt from 'jsonwebtoken';
import CustomError from '../utils/customError.js';
import logger from '../config/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;

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
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    return jwt.sign({ user_id, username }, refreshSecret, { expiresIn: '7d' });
};

export const login = async (req, res, next) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
        logger.warn('Login failed: Missing credentials');
        return next(new CustomError('Username and password are required', 400));
    }

    try {
        const [rows] = await Client.query('SELECT TOP 1 * FROM users WHERE username = @username', { username });

        if (!rows || rows.length === 0) {
            logger.warn('Login failed: Invalid credentials', { username });
            return next(new CustomError('Invalid credentials', 401));
        }

        let user = rows[0];
        const departmentQuery = `SELECT TOP 1 department_name FROM departments WHERE department_id = @department_id`;
        if (user.department_id) {
            const [deptRows] = await Client.query(departmentQuery, { department_id: user.department_id });
            if (deptRows && deptRows.length > 0) {
                user.department = deptRows[0].department_name;
            } else {
                logger.warn('Login failed: Invalid department', { username, department_id: user.department_id });
                return next(new CustomError('Invalid department', 400));
            }
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            logger.warn('Login failed: Password mismatch', { username });
            return next(new CustomError('Invalid credentials', 401));
        }

        const token = generateToken(user.user_id, user.username, user.department_id, user.role);
        const refreshToken = generateRefreshToken(user.user_id, user.username);

        const needsEmailVerification = !user.email;
        const needsPasswordChange = user.needs_password_change === true || user.needs_password_change === 1;

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
        await Client.query(audit_sql, {
            user_id: user.user_id,
            department_id: user.department_id,
            action: 'Login',
            remarks: `User ${user.username} logged in with IP ${req.ip}`
        });

        logger.info('User logged in successfully', { userId: user.user_id, username: user.username });

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
                role: user.role,
                needsPasswordChange
            },
            needsEmailVerification,
            needsPasswordChange,
            expiresIn: '24h',
            message: `Login successful as ${user.role}`
        });

    } catch (err) {
        logger.error('Server error during login', err);
        return next(new CustomError('Server error during login', 500));
    }
};

export const refreshToken = async (req, res, next) => {
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
};
