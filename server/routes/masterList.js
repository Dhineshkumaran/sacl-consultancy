import express from 'express';
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
const router = express.Router();

router.get('/', asyncErrorHandler(async(req, res, next)=>{
    const response = await Client.query(
        `SELECT * FROM master_card`
    )
    console.log(response[0]);
    res.status(200).json(response[0]);
}))

router.post('/', asyncErrorHandler(async(req, res, next)=>{
    const {pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray} = req.body || {};
    if(!pattern_code || !part_name || !material_grade || !chemical_composition, micro_structure, tensile, impact, hardness, xray){
        return res.status(400).json({message: 'Missing required fields'});
    }
    const sql = `INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await Client.query(sql, [pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray]);
    res.status(201).json({masterId: result.insertId});
}));

export default router;

    // {
    //     "id": 1,
    //     "pattern_code": "FIA-S-011-B0-20-P-01-00",
    //     "part_name": "H6 FRONT KNUCKLE",
    //     "material_grade": "FCD 590/7",
    //     "chemical_composition": "C : 3.40 - 3.80% Si : 2.20 - 2.70% Mn : 0.30 - 0.60% P : 0.030 - 0.050% S : 0.015% Max Mg : 0.030 - 0.060% Cu : 0.30% Min",
    //     "micro_structure": "Spheroidization 90% min Pearlite – Ferrite Cementite : ≤5%",
    //     "tensile": "590 N/mm² Min. 370 N/mm² Min. ≥7%",
    //     "impact": "--",
    //     "hardness": "190 – 250 BHN 10mm Ball / 3000 Kgs load",
    //     "xray": "Type A - Gas porosity : Level 2 Type B - Sand and Slag inclusions : Level 2 Type C - Shrinkage : Level 2 Type D,E,F (Crack, Hot tear & Insert) : Not allowed",
    //     "created_at": "2025-11-14T15:31:14.000Z"
    // }