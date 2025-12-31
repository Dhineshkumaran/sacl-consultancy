import express from 'express';
import crypto from 'crypto';
import Client from '../config/connection.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import transporter from '../utils/mailSender.js';

const router = express.Router();

// Store OTPs in-memory for demo (use Redis or DB in production)
const otpStore = {};

// Step 1: Request OTP
router.post('/request-reset', asyncErrorHandler(async (req, res, next) => {
  const { username, email } = req.body;
  if (!username || !email) {
    throw new CustomError('Username and email are required', 400);
  }
  const [rows] = await Client.query('SELECT * FROM users WHERE username = @username AND email = @email', { username, email });
  if (!rows || rows.length === 0) {
    throw new CustomError('User not found with provided username and email', 404);
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[username] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  await transporter.sendMail({
    to: email,
    subject: 'Your Password Reset OTP',
    text: `Your OTP for password reset is: ${otp}`,
    html: `<p>Your OTP for password reset is: <b>${otp}</b></p>`
  });
  res.json({ success: true, message: 'OTP sent to your email.' });
}));

// Step 2: Verify OTP and update password
router.post('/reset-password', asyncErrorHandler(async (req, res, next) => {
  const { username, otp, newPassword } = req.body;
  if (!username || !otp || !newPassword) {
    throw new CustomError('All fields are required', 400);
  }
  const record = otpStore[username];
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    throw new CustomError('Invalid or expired OTP', 400);
  }
  // Hash password and update in DB
  const bcrypt = await import('bcrypt');
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.default.hash(newPassword, saltRounds);
  await Client.query('UPDATE users SET password_hash = @hash WHERE username = @username', { hash, username });
  delete otpStore[username];
  res.json({ success: true, message: 'Password updated successfully.' });
}));

export default router;
