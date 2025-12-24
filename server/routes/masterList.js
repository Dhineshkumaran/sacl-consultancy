import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';
import CustomError from '../utils/customError.js';
const router = express.Router();

router.get('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const response = await Client.query(
        `SELECT * FROM master_card`
    )
    res.status(200).json({ success: true, data: response[0] });
}))

router.post('/', verifyToken, asyncErrorHandler(async (req, res, next) => {
    console.log(req.body);
    const { pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray } = req.body || {};
    if (
        !pattern_code ||
        !part_name ||
        !material_grade ||
        !chemical_composition ||
        !micro_structure ||
        !tensile ||
        !impact ||
        !hardness ||
        !xray
    ) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const chemicalCompositionStr = typeof chemical_composition === 'object'
        ? JSON.stringify(chemical_composition)
        : chemical_composition;

    const sql = `INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await Client.query(sql, [pattern_code, part_name, material_grade, chemicalCompositionStr, micro_structure, tensile, impact, hardness, xray]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Master list created', `Master list ${pattern_code} created by ${req.user.username} with part name ${part_name}`]);
    const insertId = result.insertId;
    res.status(201).json({
        success: true,
        message: "Master list created successfully.",
        id: insertId
    });
}));

router.put('/:id', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray } = req.body || {};

    if (!pattern_code || !part_name) {
        throw new CustomError('Missing required fields', 400);
    }

    const chemicalCompositionStr = typeof chemical_composition === 'object'
        ? JSON.stringify(chemical_composition)
        : chemical_composition;

    const sql = `UPDATE master_card SET pattern_code=?, part_name=?, material_grade=?, chemical_composition=?, micro_structure=?, tensile=?, impact=?, hardness=?, xray=? WHERE id=?`;
    const [result] = await Client.query(sql, [pattern_code, part_name, material_grade, chemicalCompositionStr, micro_structure, tensile, impact, hardness, xray, id]);

    if (result.affectedRows === 0) {
        throw new CustomError('Master list not found', 404);
    }

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Master list updated', `Master list ${pattern_code} updated by ${req.user.username}`]);

    res.status(200).json({
        success: true,
        message: "Master list updated successfully."
    });
}));

router.get('/by-part', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { part_name, pattern_code } = req.query;
    if (!part_name && !pattern_code) {
        throw new CustomError(400, 'Missing required fields');
    }
    let sql = 'SELECT * FROM master_card WHERE ';
    let params = [];
    if (part_name) {
        sql += 'part_name = ?';
        params.push(part_name);
    } else {
        sql += 'pattern_code = ?';
        params.push(pattern_code);
    }
    const [response] = await Client.query(sql, params);
    if (response.length === 0) {
        throw new CustomError(404, 'No master data found for the specified part');
    }
    res.status(200).json({ success: true, data: response[0] });
}));

export default router;
