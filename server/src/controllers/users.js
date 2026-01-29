import crypto from 'crypto';
import bcrypt from 'bcrypt';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';
import sendMail from '../utils/mailSender.js';
import logger from '../config/logger.js';

export const getAllUsers = async (req, res, next) => {
    const [rows] = await Client.execute(`
    SELECT u.user_id, u.username, u.full_name, u.email, u.department_id, 
           d.department_name, u.role, u.is_active, u.created_at 
    FROM users u 
    LEFT JOIN departments d ON u.department_id = d.department_id WHERE u.role NOT IN ('Admin')
  `);
    res.status(200).json({ users: rows });
};

export const createUser = async (req, res, next) => {
    const { username, password, full_name, department_id, role } = req.body;
    if (!username || !password || !full_name || !department_id || !role) {
        throw new CustomError('Missing required fields', 400);
    }
    const [existing] = await Client.query('SELECT TOP 1 user_id FROM users WHERE username = @username', { username });
    if (existing && existing.length > 0) {
        logger.warn('User creation failed: Username exists', { username });
        throw new CustomError('Username already in use', 409);
    }
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(password, saltRounds);
    const sql = 'INSERT INTO users (username, full_name, password_hash, department_id, role, needs_password_change, email_verified) VALUES (@username, @full_name, @password_hash, @department_id, @role, 1, 0)';
    await Client.query(sql, { username, full_name, password_hash: hash, department_id, role });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'User created',
        remarks: `User ${username} created by ${req.user.username}`
    });

    logger.info('User created', { username, createdBy: req.user.username });
    res.status(201).json({ success: true, message: 'User created successfully.' });
};

export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const user = req.user;
    if (!userId) throw new CustomError('User ID is required', 400);
    const sql = 'DELETE FROM users WHERE user_id = @user_id';
    await Client.query(sql, { user_id: userId });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        action: 'User deleted',
        remarks: `User ${userId} deleted by ${user.username}`
    });

    logger.info('User deleted', { userId, deletedBy: user.username });
    res.status(200).json({ success: true, message: 'User deleted successfully.' });
};

export const sendOtp = async (req, res, next) => {
    const { email } = req.body || {};
    const user = req.user;
    if (!email) throw new CustomError('Email is required', 400);

    const [existing] = await Client.query('SELECT TOP 1 user_id FROM users WHERE email = @email AND user_id != @user_id', { email, user_id: user.user_id });
    if (existing && existing.length > 0) {
        throw new CustomError('Email already in use by another account', 409);
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const sql = `INSERT INTO email_otps (user_id, email, otp_code, expires_at) VALUES (@user_id, @email, @otp_code, DATEADD(minute, 5, GETDATE()))`;
    try {
        await Client.query(sql, { user_id: user.user_id || null, email, otp_code: otp });
    } catch (err) {
        logger.error('Error storing OTP', err);
        throw new CustomError('Server error storing OTP', 500);
    }

    try {
        await sendMail({
            to: email,
            subject: 'Your verification code',
            text: `Your OTP code is: ${otp}. It expires in 5 minutes.`
        });
        logger.info('OTP sent', { email, userId: user.user_id });
    } catch (err) {
        logger.error('Failed to send verification email', err);
        throw new CustomError('Failed to send verification email', 500);
    }

    return res.json({ success: true, message: 'OTP sent' });
};

export const verifyOtp = async (req, res, next) => {
    const { email, otp } = req.body || {};
    const user = req.user;
    if (!email || !otp) throw new CustomError('Email and OTP are required', 400);
    const selectSql = `SELECT TOP 1 otp_id, otp_code, attempts, expires_at FROM email_otps
    WHERE user_id = @user_id AND email = @email AND used = 0 AND expires_at > GETDATE()
    ORDER BY created_at DESC`;
    const [rows] = await Client.query(selectSql, { user_id: user.user_id || null, email });
    if (!rows || rows.length === 0) {
        logger.warn('OTP verification failed: Not found or expired', { email, userId: user.user_id });
        throw new CustomError('OTP not found or expired', 400);
    }

    const record = rows[0];
    const otpId = record.otp_id;

    if (String(record.otp_code) !== String(otp)) {
        await Client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE otp_id = @otp_id', { otp_id: otpId });
        const attempts = (record.attempts || 0) + 1;
        if (attempts >= 5) {
            await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
            logger.warn('OTP invalidated due to max attempts', { otpId });
        }
        throw new CustomError('Invalid OTP', 400);
    }

    try {
        await Client.query('UPDATE users SET email = @email, email_verified = 1 WHERE user_id = @user_id', { email, user_id: user.user_id });
    } catch (err) {
        await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });
        logger.error('Error updating user email', err);
        return next(new CustomError('Email already in use', 409));
    }

    await Client.query('UPDATE email_otps SET used = 1 WHERE otp_id = @otp_id', { otp_id: otpId });

    logger.info('Email verified and updated', { userId: user.user_id, email });
    return res.json({ success: true, message: 'Email verified and updated' });
};

export const changePassword = async (req, res, next) => {
    const { newPassword } = req.body || {};
    const user = req.user;
    if (!newPassword) throw new CustomError('New password is required', 400);
    if (typeof newPassword !== 'string' || newPassword.length < 6) throw new CustomError('Password must be at least 6 characters', 400);

    if (newPassword === user.username) throw new CustomError('New password must not be your username', 400);

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    await Client.query('UPDATE users SET password_hash = @password_hash, needs_password_change = 0 WHERE user_id = @user_id', { password_hash: hash, user_id: user.user_id });

    logger.info('Password updated', { userId: user.user_id });
    return res.json({ success: true, message: 'Password updated' });
};

export const updateUsername = async (req, res, next) => {
    const { username } = req.body || {};
    const user = req.user;

    if (!username) throw new CustomError('Username is required', 400);
    if (typeof username !== 'string' || username.trim().length === 0) throw new CustomError('Username cannot be empty', 400);
    if (username === user.username) throw new CustomError('New username must be different from current username', 400);

    const [existing] = await Client.query('SELECT TOP 1 user_id FROM users WHERE username = @username', { username });
    if (existing && existing.length > 0) {
        throw new CustomError('Username already in use', 409);
    }

    await Client.query('UPDATE users SET username = @username WHERE user_id = @user_id', { username, user_id: user.user_id });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        action: 'Username updated',
        remarks: `Username changed from ${user.username} to ${username}`
    });

    logger.info('Username updated', { userId: user.user_id, oldUsername: user.username, newUsername: username });
    return res.json({ success: true, message: 'Username updated successfully' });
};

export const changeStatus = async (req, res, next) => {
    const { userId, status } = req.body || {};
    if (!userId) throw new CustomError('User ID and status are required', 400);
    if (typeof status !== 'boolean') throw new CustomError('Status must be a boolean', 400);

    await Client.query('UPDATE users SET is_active = @is_active WHERE user_id = @user_id', { is_active: status, user_id: userId });

    logger.info('User status updated', { userId, status, updatedBy: req.user.username });
    return res.json({ success: true, message: 'User status updated' });
};

export const uploadProfilePhoto = async (req, res, next) => {
    const { photoBase64 } = req.body || {};
    const user = req.user;

    if (!photoBase64) throw new CustomError('Photo is required', 400);
    if (typeof photoBase64 !== 'string') throw new CustomError('Photo must be a base64 string', 400);

    if (!photoBase64.startsWith('data:image')) throw new CustomError('Invalid image format. Please upload a valid image.', 400);

    const maxPhotoSize = 5242880;
    if (photoBase64.length > maxPhotoSize) {
        throw new CustomError('Photo size exceeds maximum limit of 5MB', 400);
    }

    await Client.query('UPDATE users SET profile_photo = @profile_photo WHERE user_id = @user_id', {
        profile_photo: photoBase64,
        user_id: user.user_id
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: user.user_id,
        department_id: user.department_id,
        action: 'Profile photo updated',
        remarks: `Profile photo updated by ${user.username}`
    });

    logger.info('Profile photo updated', { userId: user.user_id });
    return res.json({ success: true, message: 'Profile photo uploaded successfully' });
};

export const getProfilePhoto = async (req, res, next) => {
    const user = req.user;

    const [rows] = await Client.query('SELECT profile_photo FROM users WHERE user_id = @user_id', { user_id: user.user_id });

    if (!rows || rows.length === 0) {
        throw new CustomError('User not found', 404);
    }

    const profilePhoto = rows[0].profile_photo;

    return res.json({ success: true, profilePhoto: profilePhoto || null });
};

export const adminUpdateUser = async (req, res, next) => {
    const { userId } = req.params;
    const { username, full_name, email, department_id, role, password } = req.body;

    if (!userId || isNaN(userId)) {
        throw new CustomError('Valid User ID is required', 400);
    }
    const [existingUser] = await Client.query('SELECT * FROM users WHERE user_id = @userId', { userId });
    if (!existingUser || existingUser.length === 0) {
        throw new CustomError('User not found', 404);
    }

    if (username && username !== existingUser[0].username) {
        const [duplicate] = await Client.query('SELECT user_id FROM users WHERE username = @username AND user_id != @userId', { username, userId });
        if (duplicate && duplicate.length > 0) {
            throw new CustomError('Username already in use', 409);
        }
    }

    let passwordHash = null;
    let needsChange = null;
    if (password) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        passwordHash = await bcrypt.hash(password, saltRounds);
        needsChange = 1;
    }

    let emailVerified = existingUser[0].email_verified;
    if (email !== undefined && email !== existingUser[0].email) {
        emailVerified = 0;
    }

    const sql = `
        UPDATE users 
        SET username = COALESCE(@username, username),
            full_name = COALESCE(@full_name, full_name),
            email = COALESCE(@email, email),
            email_verified = @email_verified,
            department_id = COALESCE(@department_id, department_id),
            role = COALESCE(@role, role),
            password_hash = COALESCE(@password_hash, password_hash),
            needs_password_change = COALESCE(@needs_password_change, needs_password_change)
        WHERE user_id = @userId
    `;

    await Client.query(sql, {
        userId,
        username: username || null,
        full_name: full_name || null,
        email: email === undefined ? null : email,
        email_verified: emailVerified,
        department_id: department_id || null,
        role: role || null,
        password_hash: passwordHash,
        needs_password_change: needsChange
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@admin_id, @admin_dept, @action, @remarks)';
    await Client.query(audit_sql, {
        admin_id: req.user.user_id,
        admin_dept: req.user.department_id,
        action: 'Admin Update User',
        remarks: `Admin ${req.user.username} updated user ${username || existingUser[0].username}`
    });

    logger.info('Admin updated user', { adminId: req.user.user_id, targetUserId: userId });

    res.json({ success: true, message: 'User updated successfully' });
};