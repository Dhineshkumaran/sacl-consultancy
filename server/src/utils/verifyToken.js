import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import Client from '../config/connection.js';

const verifyToken = asyncErrorHandler(async (req, res, next) => {
    let token = req.get('Authorization') || req.get('authorization');
    if (!token) {
        throw new CustomError('Token not found', 401);
    }
    if (token.startsWith('Bearer ')) token = token.slice(7);

    if (!process.env.JWT_SECRET) {
        throw new CustomError('Server misconfiguration: JWT secret missing', 500);
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new CustomError('Invalid token', 401);
    }

    const username = decodedToken.username || decodedToken.user?.username || decodedToken.user;
    if (!username) throw new CustomError('Invalid token payload', 401);

    const [rows] = await Client.query(
        'SELECT TOP 1 user_id, username, department_id, role FROM users WHERE username = @username',
        { username }
    );

    if (!rows || rows.length === 0) {
        throw new CustomError('User not found. Invalid token.', 404);
    }

    const user = rows[0];
    req.user = user;

    return next();
});

export default verifyToken;