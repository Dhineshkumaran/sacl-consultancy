import express from 'express';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';
import authorizeRoles from '../utils/authorizeRoles.js';
import transporter from '../utils/mailSender.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const [rows] = await Client.execute('SELECT user_id, username, full_name, email, department_id, role, created_at FROM users');
  res.status(200).json({ users: rows });
}));

router.post('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const { username, full_name, password, email, department_id, role } = req.body;
  if (!username || !password || !full_name || !email || !department_id || !role) {
    throw new CustomError('Missing required fields', 400);
  }
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.hash(password, saltRounds);
  const sql = 'INSERT INTO users (username, full_name, password_hash, email, department_id, role) VALUES (?, ?, ?, ?, ?, ?)';
  const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
  const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'User created', `User ${username} created by ${req.user.username}`]);
  const [result] = await Client.execute(sql, [username, full_name, hash, email, department_id, role]);
  res.status(201).json({ userId: result.insertId });
}));

router.post('/send-otp', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body || {};
  const user = req.user;
  if (!email) throw new CustomError('Email is required', 400);

  const [existing] = await Client.execute('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing && existing.length > 0) {
    throw new CustomError('Email already in use', 409);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const sql = `INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`;
  try {
    await Client.execute(sql, [user.user_id || null, email, otp]);
  } catch (err) {
    console.error('Failed to persist OTP', err);
    throw new CustomError('Server error storing OTP', 500);
  }

  try {
    await transporter.sendMail({
      to: email,
      subject: 'Your verification code',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`
    });
  } catch (err) {
    console.error('Failed to send OTP email', err);
    throw new CustomError('Failed to send verification email', 500);
  }

  return res.json({ success: true, message: 'OTP sent' });
}));

router.post('/verify-otp', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { email, otp } = req.body || {};
  const user = req.user;
  if (!email || !otp) throw new CustomError('Email and OTP are required', 400);
  const selectSql = `SELECT otp_id, otp_code, attempts, expires_at FROM email_otps
    WHERE user_id = ? AND email = ? AND used = 0 AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1`;
  const [rows] = await Client.execute(selectSql, [user.user_id || null, email]);
  if (!rows || rows.length === 0) {
    throw new CustomError('OTP not found or expired', 400);
  }

  const record = rows[0];
  const otpId = record.otp_id;

  if (String(record.otp_code) !== String(otp)) {
    await Client.execute('UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = ?', [otpId]);
    const attempts = (record.attempts || 0) + 1;
    if (attempts >= 5) {
      await Client.execute('UPDATE email_otps SET used = 1 WHERE otp_id = ?', [otpId]);
    }
    throw new CustomError('Invalid OTP', 400);
  }

  try {
    await Client.execute('UPDATE users SET email = ? WHERE user_id = ?', [email, user.user_id]);
  } catch (err) {
    await Client.execute('UPDATE email_otps SET used = 1 WHERE otp_id = ?', [otpId]);
    return next(new CustomError('Email already in use', 409));
  }

  await Client.execute('UPDATE email_otps SET used = 1 WHERE otp_id = ?', [otpId]);

  return res.json({ success: true, message: 'Email verified and updated' });
}));

router.post('/change-password', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { newPassword } = req.body || {};
  const user = req.user;
  if (!newPassword) throw new CustomError('New password is required', 400);
  if (typeof newPassword !== 'string' || newPassword.length < 6) throw new CustomError('Password must be at least 6 characters', 400);

  const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || 'sacl123';
  if (newPassword === DEFAULT_PASSWORD) throw new CustomError('New password must not be the default password', 400);

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.hash(newPassword, saltRounds);

  await Client.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, user.user_id]);

  return res.json({ success: true, message: 'Password updated' });
}));

export default router;

// CREATE TABLE audit_log (
//     audit_id SERIAL PRIMARY KEY,
//     user_id INT REFERENCES users(user_id) NOT NULL,
//     department_id INT REFERENCES departments(department_id) NOT NULL,
//     action VARCHAR(100) NOT NULL,
//     action_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     remarks TEXT
// );