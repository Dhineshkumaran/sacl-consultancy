import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import verifyToken from '../utils/verifyToken.js';
const router = express.Router();

router.get('/', verifyToken, asyncErrorHandler(async(req, res, next)=>{
    const response = await Client.query(
        `SELECT * FROM master_card`
    )
    res.status(200).json({success:true, data:response[0]});
}))

router.post('/', verifyToken, asyncErrorHandler(async(req, res, next)=>{
    const {pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray} = req.body || {};
    if(
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
        return res.status(400).json({success: false, message: 'Missing required fields'});
    }
    const sql = `INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await Client.query(sql, [pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray]);
    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (?, ?, ?, ?)';
    const [audit_result] = await Client.query(audit_sql, [req.user.user_id, req.user.department_id, 'Master list created', `Master list ${pattern_code} created by ${req.user.username} with part name ${part_name}`]);
    const insertId = result.insertId;
    res.status(201).json({
        success: true,
        message: "Master list created successfully.",
        id: insertId
    });
}));

export default router;
