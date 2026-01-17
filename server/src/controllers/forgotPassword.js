import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import logger from '../config/logger.js';
dotenv.config();

const otpStore = {};

export const requestReset = async (req, res, next) => {
    const { username, email } = req.body;
    if (!username || !email) {
        throw new CustomError('Username and email are required', 400);
    }
    const [rows] = await Client.query('SELECT * FROM users WHERE username = @username AND email = @email', { username, email });
    if (!rows || rows.length === 0) {
        logger.warn('Password reset requested for invalid user', { username, email });
        throw new CustomError('User not found with provided username and email', 404);
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[username] = { otp, expires: Date.now() + 10 * 60 * 1000 };

    try {
        await transporter.sendMail({
            to: email,
            subject: 'Your Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}`,
            html: `<p>Your OTP for password reset is: <b>${otp}</b></p>`
        });
        logger.info('Password reset OTP sent', { username, email });
    } catch (err) {
        logger.error('Failed to send password reset email', err);
        throw new CustomError('Failed to send password reset email', 500);
    }

    res.json({ success: true, message: 'OTP sent to your email.' });
};

export const resetPassword = async (req, res, next) => {
    const { username, otp, newPassword } = req.body;
    if (!username || !otp || !newPassword) {
        throw new CustomError('All fields are required', 400);
    }
    const record = otpStore[username];
    if (!record || record.otp !== otp || record.expires < Date.now()) {
        logger.warn('Password reset failed: Invalid OTP', { username });
        throw new CustomError('Invalid or expired OTP', 400);
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);
    await Client.query('UPDATE users SET password_hash = @hash WHERE username = @username', { hash, username });
    delete otpStore[username];

    logger.info('Password reset successful', { username });
    res.json({ success: true, message: 'Password updated successfully.' });
};
