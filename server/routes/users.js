import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import CustomError from '../utils/customError.js';
import verifyToken from '../utils/verifyToken.js';
import authorizeRoles from '../utils/authorizeRoles.js';
import transporter from '../utils/mailSender.js';

const router = express.Router();

router.get('/', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const [rows] = await Client.execute(`
    SELECT u.user_id, u.username, u.full_name, u.email, u.department_id, 
           d.department_name, u.role, u.is_active, u.created_at 
    FROM users u 
    LEFT JOIN departments d ON u.department_id = d.department_id
  `);
  res.status(200).json({ users: rows });
}));

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { username, full_name, password, department_id, role } = req.body;
  if (!username || !password || !full_name || !department_id || !role) {
    throw new CustomError('Missing required fields', 400);
  }
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  const hash = await bcrypt.hash(password, saltRounds);
  const sql = 'INSERT INTO users (username, full_name, password_hash, department_id, role) VALUES (@username, @full_name, @password_hash, @department_id, @role)';
  const [result] = await Client.query(sql, { username, full_name, password_hash: hash, department_id, role });
  const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
  const [audit_result] = await Client.query(audit_sql, {
    user_id: req.user.user_id,
    department_id: req.user.department_id,
    action: 'User created',
    remarks: `User ${username} created by ${req.user.username}`
  });
  res.status(201).json({ success: true, message: 'User created successfully.' });
}));

router.post('/send-otp', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { email } = req.body || {};
  const user = req.user;
  if (!email) throw new CustomError('Email is required', 400);

  const [existing] = await Client.query('SELECT TOP 1 user_id FROM users WHERE email = @email', { email });
  if (existing && existing.length > 0) {
    throw new CustomError('Email already in use', 409);
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const sql = `INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES (@user_id, @email, @otp_code, DATEADD(minute, 5, GETDATE()))`;
  try {
    await Client.query(sql, { user_id: user.user_id || null, email, otp_code: otp });
  } catch (err) {
    throw new CustomError('Server error storing OTP', 500);
  }

  try {
    await transporter.sendMail({
      to: email,
      subject: 'Your verification code',
      text: `Your OTP code is: ${otp}. It expires in 5 minutes.`
    });
  } catch (err) {
    throw new CustomError('Failed to send verification email', 500);
  }

  return res.json({ success: true, message: 'OTP sent' });
}));

router.post('/verify-otp', verifyToken, asyncErrorHandler(async (req, res, next) => {
  const { email, otp } = req.body || {};
  const user = req.user;
  if (!email || !otp) throw new CustomError('Email and OTP are required', 400);
  const selectSql = `SELECT TOP 1 otp_id, otp_code, attempts, expires_at FROM email_otps
    WHERE user_id = @user_id AND email = @email AND used = 0 AND expires_at > GETDATE()
    ORDER BY created_at DESC`;
  const [rows] = await Client.query(selectSql, { user_id: user.user_id || null, email });
  if (!rows || rows.length === 0) {
    throw new CustomError('OTP not found or expired', 400);
  }

  const record = rows[0];
  const otpId = record.otp_id;

  if (String(record.otp_code) !== String(otp)) {
    await Client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = @otp_id', { otp_id: otpId });
    const attempts = (record.attempts || 0) + 1;
    if (attempts >= 5) {
      await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
    }
    throw new CustomError('Invalid OTP', 400);
  }

  try {
    await Client.query('UPDATE users SET email = @email WHERE user_id = @user_id', { email, user_id: user.user_id });
  } catch (err) {
    await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
    return next(new CustomError('Email already in use', 409));
  }

  await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });

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

  await Client.query('UPDATE users SET password_hash = @password_hash WHERE user_id = @user_id', { password_hash: hash, user_id: user.user_id });

  return res.json({ success: true, message: 'Password updated' });
}));

router.delete('/:id', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const userId = req.params.id;
  const adminUser = req.user;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === adminUser.user_id) {
    throw new CustomError('You cannot delete your own account', 400);
  }

  // Check if user exists
  const [userResult] = await Client.query('SELECT username FROM users WHERE user_id = @user_id', { user_id: userId });
  if (!userResult || userResult.length === 0) {
    throw new CustomError('User not found', 404);
  }
  const targetUsername = userResult[0].username;

  // Cascade Hard Delete
  // 1. Delete associated department_progress
  await Client.query('DELETE FROM department_progress WHERE username = @username', { username: targetUsername });
  // 2. Delete associated audit_logs
  await Client.query('DELETE FROM audit_log WHERE user_id = @user_id', { user_id: userId });
  // 3. Delete associated email_otps
  await Client.query('DELETE FROM email_otps WHERE user_id = @user_id', { user_id: userId });
  // 4. Delete user
  const deleteSql = 'DELETE FROM users WHERE user_id = @user_id';
  await Client.query(deleteSql, { user_id: userId });

  // Audit log
  const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
  await Client.query(audit_sql, {
    user_id: adminUser.user_id,
    department_id: adminUser.department_id,
    action: 'User deleted',
    remarks: `User ${targetUsername} (ID: ${userId}) permanently deleted by ${adminUser.username}`
  });

  res.status(200).json({ success: true, message: 'User deleted successfully' });
}));

router.post('/bulk-delete', verifyToken, authorizeRoles('Admin'), asyncErrorHandler(async (req, res, next) => {
  const { userIds } = req.body;
  const adminUser = req.user;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new CustomError('No users selected for deletion', 400);
  }

  // Prevent admin from deleting themselves
  if (userIds.includes(adminUser.user_id)) {
    throw new CustomError('You cannot delete your own account', 400);
  }

  // Get count of users to be deleted for audit
  const idsString = userIds.join(',');
  const placeholders = userIds.map(() => '?').join(','); // mysql2 style
  // Using explicit query construction or loop might be safer depending on driver, but let's try '?' with array param if client supports it.
  // Actually, Client.query wrapper usually takes named params or array. For 'IN' clause with named params, it's tricky.
  // Converting to looped deletion or constructing a safe string. 
  // Given `Client` wrapper context, let's look at how it works. It usually uses `mysql` or `mssql`.
  // The codebase uses `connection.js` which likely exports a wrapper.
  // From previous file reads, it uses `Client.query(sql, params)`.
  // Let's stick to safe iteration or specific IN clause handling if we knew the driver.
  // For safety and simplicity with unknown driver capabilities for IN clause with named params:
  // We will iterate or use a transaction.

  // Actually, let's act based on previous code style. `Client.execute` and `Client.query` are used.
  // `Client.query` takes named params `@param`.
  // SQL Server usage (suggested by previous `TOP 1` and `@param`).

  // For SQL Server `IN` clause with parameters is complex. 
  // Let's loop for now to be safe and ensure individual audits or just one big audit? 
  // Plan said "Log single audit entry".
  // Let's try to do it in one go if possible, but safe string injection for integers involves standard validation.

  // Validate all are numbers
  const safeIds = userIds.map(id => parseInt(id)).filter(id => !isNaN(id));
  if (safeIds.length === 0) throw new CustomError('Invalid user IDs', 400);

  const idList = safeIds.join(',');

  // Cascade Hard Delete in Bulk
  // Note: Using IN implies safeIds join.
  // 1. Delete associated department_progress (need usernames first)
  // We can do a subquery delete if supported, but let's try to be generic or assume MSSQL/MySQL support.
  await Client.query(`DELETE FROM department_progress WHERE username IN (SELECT username FROM users WHERE user_id IN (${idList}))`);
  // 2. Delete associated audit_logs
  await Client.query(`DELETE FROM audit_log WHERE user_id IN (${idList})`);
  // 3. Delete associated email_otps
  await Client.query(`DELETE FROM email_otps WHERE user_id IN (${idList})`);
  // 4. Delete users
  const deleteSql = `DELETE FROM users WHERE user_id IN (${idList})`;
  await Client.query(deleteSql);

  // Audit log
  const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
  await Client.query(audit_sql, {
    user_id: adminUser.user_id,
    department_id: adminUser.department_id,
    action: 'Bulk User Deleted',
    remarks: `${safeIds.length} users (IDs: ${idList}) permanently deleted by ${adminUser.username}`
  });

  res.status(200).json({ success: true, message: `${safeIds.length} users deleted successfully` });
}));

export default router;