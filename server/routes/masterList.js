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

    const sql = `INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES (@pattern_code, @part_name, @material_grade, @chemical_composition, @micro_structure, @tensile, @impact, @hardness, @xray)`;
    const [result] = await Client.query(sql, {
        pattern_code,
        part_name,
        material_grade,
        chemical_composition: chemicalCompositionStr,
        micro_structure,
        tensile,
        impact,
        hardness,
        xray
    });
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    const [audit_result] = await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Master list created',
        remarks: `Master list ${pattern_code} created by ${req.user.username} with part name ${part_name}`
    });
    res.status(201).json({
        success: true,
        message: "Master list created successfully."
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

    const sql = `UPDATE master_card SET pattern_code=@pattern_code, part_name=@part_name, material_grade=@material_grade, chemical_composition=@chemical_composition, micro_structure=@micro_structure, tensile=@tensile, impact=@impact, hardness=@hardness, xray=@xray WHERE id=@id`;
    const [result] = await Client.query(sql, {
        pattern_code,
        part_name,
        material_grade,
        chemical_composition: chemicalCompositionStr,
        micro_structure,
        tensile,
        impact,
        hardness,
        xray,
        id
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Master list updated',
        remarks: `Master list ${pattern_code} updated by ${req.user.username}`
    });

    res.status(200).json({
        success: true,
        message: "Master list updated successfully."
    });
}));

export default router;
