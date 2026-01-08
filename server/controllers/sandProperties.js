import Client from '../config/connection.js';

import { updateDepartment, updateRole } from '../services/departmentProgress.js';

export const createSandProperties = async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks } = req.body || {};

    if (!trial_id || !date || !t_clay || !a_clay || !vcm || !loi || !afs || !gcs || !moi || !compactability || !permeability || !remarks) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await Client.transaction(async (trx) => {
        const sql = 'INSERT INTO sand_properties (trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks) VALUES (@trial_id, @date, @t_clay, @a_clay, @vcm, @loi, @afs, @gcs, @moi, @compactability, @permeability, @remarks)';
        await trx.query(sql, { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks });

        const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
        await trx.query(audit_sql, {
            user_id: req.user.user_id,
            department_id: req.user.department_id,
            trial_id,
            action: 'Sand properties created',
            remarks: `Sand properties ${trial_id} created by ${req.user.username} with trial id ${trial_id}`
        });
        await updateRole(trial_id, req.user, trx);
    });

    res.status(201).json({ success: true, message: 'Sand properties created successfully.' });
};

export const updateSandProperties = async (req, res, next) => {
    const { trial_id, date, t_clay, a_clay, vcm, loi, afs, gcs, moi, compactability, permeability, remarks, is_edit } = req.body || {};

    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'Trial ID is required' });
    }

    await Client.transaction(async (trx) => {
        if(is_edit){
            const sql = `UPDATE sand_properties SET 
                date = COALESCE(@date, date),
                t_clay = COALESCE(@t_clay, t_clay),
                a_clay = COALESCE(@a_clay, a_clay),
                vcm = COALESCE(@vcm, vcm),
                loi = COALESCE(@loi, loi),
                afs = COALESCE(@afs, afs),
                gcs = COALESCE(@gcs, gcs),
                moi = COALESCE(@moi, moi),
                compactability = COALESCE(@compactability, compactability),
                permeability = COALESCE(@permeability, permeability),
                remarks = COALESCE(@remarks, remarks)
                WHERE trial_id = @trial_id`;

            await trx.query(sql, {
                trial_id,
                date: date || null,
                t_clay: t_clay || null,
                a_clay: a_clay || null,
                vcm: vcm || null,
                loi: loi || null,
                afs: afs || null,
                gcs: gcs || null,
                moi: moi || null,
                compactability: compactability || null,
                permeability: permeability || null,
                remarks: remarks || null
            });

            const audit_sql = 'INSERT INTO audit_log (user_id, department_id, trial_id, action, remarks) VALUES (@user_id, @department_id, @trial_id, @action, @remarks)';
            await trx.query(audit_sql, {
                user_id: req.user.user_id,
                department_id: req.user.department_id,
                trial_id,
                action: 'Sand properties updated',
                remarks: `Sand properties ${trial_id} updated by ${req.user.username} with trial id ${trial_id}`
            });
        }
        await updateDepartment(trial_id, req.user, trx);
    });

    res.status(201).json({
        success: true,
        message: "Sand properties updated successfully."
    });
};

export const getSandProperties = async (req, res, next) => {
    const [rows] = await Client.query('SELECT * FROM sand_properties');
    res.status(200).json({ success: true, data: rows });
};

export const getSandPropertiesByTrialId = async (req, res, next) => {
    let trial_id = req.query.trial_id;
    if (!trial_id) {
        return res.status(400).json({ success: false, message: 'trial_id query parameter is required' });
    }
    trial_id = trial_id.replace(/['"]+/g, '');
    const [rows] = await Client.query('SELECT * FROM sand_properties WHERE trial_id = @trial_id', { trial_id });
    res.status(200).json({ success: true, data: rows });
};
