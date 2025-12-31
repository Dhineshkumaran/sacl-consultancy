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
    const { pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray, tooling } = req.body || {};
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

    const toolingStr = typeof tooling === 'object'
        ? JSON.stringify(tooling)
        : tooling;

    const sql = `INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray, tooling) VALUES (@pattern_code, @part_name, @material_grade, @chemical_composition, @micro_structure, @tensile, @impact, @hardness, @xray, @tooling)`;
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
        tooling: toolingStr
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
    const { pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray, tooling } = req.body || {};

    if (!pattern_code || !part_name) {
        throw new CustomError('Missing required fields', 400);
    }

    const chemicalCompositionStr = typeof chemical_composition === 'object'
        ? JSON.stringify(chemical_composition)
        : chemical_composition;

    const toolingStr = typeof tooling === 'object'
        ? JSON.stringify(tooling)
        : tooling;

    const sql = `UPDATE master_card SET pattern_code=@pattern_code, part_name=@part_name, material_grade=@material_grade, chemical_composition=@chemical_composition, micro_structure=@micro_structure, tensile=@tensile, impact=@impact, hardness=@hardness, xray=@xray, tooling=@tooling WHERE id=@id`;
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
        tooling: toolingStr,
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

router.delete('/bulk', verifyToken, asyncErrorHandler(async (req, res, next) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new CustomError('No IDs provided for deletion', 400);
    }

    // Create parameters map for the IN clause
    const params = {};
    const placeholders = ids.map((id, index) => {
        const paramName = `id${index}`;
        params[paramName] = id;
        return `@${paramName}`;
    });

    const sql = `DELETE FROM master_card WHERE id IN (${placeholders.join(',')})`;
    await Client.query(sql, params);

    // Audit Log
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Master list bulk delete',
        remarks: `Deleted ${ids.length} master list items by ${req.user.username}`
    });

    res.status(200).json({
        success: true,
        message: `${ids.length} items deleted successfully`
    });
}));

export default router;
