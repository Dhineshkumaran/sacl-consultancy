import express from 'express';
const router = express.Router();
import asyncErrorHandler from '../utils/asyncErrorHandler.js';
import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

router.post('/', asyncErrorHandler(async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks } = req.body || {};
    if (!trial_id || !date || !t_clay || !a_clay || !vcm || !loi || !afs || !gcs || !moi || !compactability || !permeability || !other_remarks) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    const sql = 'INSERT INTO sand_properties (trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [result] = await Client.query(sql, [trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, other_remarks]);
    res.status(201).json({ sandPropertiesId: result.insertId });
}));

router.get('/', asyncErrorHandler(async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM sand_properties');
    res.status(200).json({ sandProperties: rows });
}));

router.get('/trial_id', asyncErrorHandler(async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM sand_properties WHERE trial_id = ?', [trial_id]);
    res.status(200).json({ sandProperties: rows });
}));

// CREATE TABLE sand_properties (
//     id SERIAL PRIMARY KEY,
//     trial_id TEXT REFERENCES trial_cards(trial_id) NOT NULL,
//     date DATE,
//     t_clay NUMERIC(6,3),
//     a_clay NUMERIC(6,3),
//     vcm NUMERIC(6,3),
//     loi NUMERIC(6,3),
//     afs NUMERIC(6,3),
//     gcs NUMERIC(6,3),
//     moi NUMERIC(6,3),
//     compactability NUMERIC(6,3),
//     permeability NUMERIC(6,3),
//     other_remarks TEXT
// );