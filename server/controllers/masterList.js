import Client from '../config/connection.js';
import CustomError from '../utils/customError.js';

export const getMasterList = async (req, res, next) => {
    const query = `
        SELECT 
            m.*,
            t.id as tooling_id,
            t.number_of_cavity,
            t.cavity_identification,
            t.pattern_material,
            t.core_weight,
            t.core_mask_thickness,
            t.estimated_casting_weight,
            t.estimated_bunch_weight,
            t.pattern_plate_thickness_sp,
            t.pattern_plate_weight_sp,
            t.core_mask_weight_sp,
            t.crush_pin_height_sp,
            t.calculated_yield_sp,
            t.pattern_plate_thickness_pp,
            t.pattern_plate_weight_pp,
            t.core_mask_weight_pp,
            t.crush_pin_height_pp,
            t.calculated_yield_pp,
            t.yield_label,
            t.remarks as tooling_remarks,
            t.created_at as tooling_created_at,
            t.updated_at as tooling_updated_at
        FROM master_card m
        LEFT JOIN tooling_pattern_data t ON m.id = t.master_card_id
    `;
    const [rows] = await Client.query(query);

    const data = rows.map(row => {
        const {
            tooling_id,
            number_of_cavity,
            cavity_identification,
            pattern_material,
            core_weight,
            core_mask_thickness,
            estimated_casting_weight,
            estimated_bunch_weight,
            pattern_plate_thickness_sp,
            pattern_plate_weight_sp,
            core_mask_weight_sp,
            crush_pin_height_sp,
            calculated_yield_sp,
            pattern_plate_thickness_pp,
            pattern_plate_weight_pp,
            core_mask_weight_pp,
            crush_pin_height_pp,
            calculated_yield_pp,
            yield_label,
            tooling_remarks,
            tooling_created_at,
            tooling_updated_at,
            ...masterData
        } = row;

        const tooling = tooling_id ? {
            id: tooling_id,
            number_of_cavity,
            cavity_identification,
            pattern_material,
            core_weight,
            core_mask_thickness,
            estimated_casting_weight,
            estimated_bunch_weight,
            pattern_plate_thickness_sp,
            pattern_plate_weight_sp,
            core_mask_weight_sp,
            crush_pin_height_sp,
            calculated_yield_sp,
            pattern_plate_thickness_pp,
            pattern_plate_weight_pp,
            core_mask_weight_pp,
            crush_pin_height_pp,
            calculated_yield_pp,
            yield_label,
            remarks: tooling_remarks,
            created_at: tooling_created_at,
            updated_at: tooling_updated_at
        } : null;

        return {
            ...masterData,
            tooling
        };
    });

    res.status(200).json({ success: true, data });
};

export const getMasterByPatternCode = async (req, res, next) => {
    const { pattern_code } = req.query;

    if (!pattern_code) {
        return res.status(400).json({ success: false, message: 'Pattern code is required' });
    }

    const query = `
        SELECT 
            m.*,
            t.id as tooling_id,
            t.number_of_cavity,
            t.cavity_identification,
            t.pattern_material,
            t.core_weight,
            t.core_mask_thickness,
            t.estimated_casting_weight,
            t.estimated_bunch_weight,
            t.pattern_plate_thickness_sp,
            t.pattern_plate_weight_sp,
            t.core_mask_weight_sp,
            t.crush_pin_height_sp,
            t.calculated_yield_sp,
            t.pattern_plate_thickness_pp,
            t.pattern_plate_weight_pp,
            t.core_mask_weight_pp,
            t.crush_pin_height_pp,
            t.calculated_yield_pp,
            t.yield_label,
            t.remarks as tooling_remarks,
            t.created_at as tooling_created_at,
            t.updated_at as tooling_updated_at
        FROM master_card m
        LEFT JOIN tooling_pattern_data t ON m.id = t.master_card_id
        WHERE m.pattern_code = @pattern_code
    `;
    const [rows] = await Client.query(query, { pattern_code });

    const data = rows.map(row => {
        const {
            tooling_id,
            number_of_cavity,
            cavity_identification,
            pattern_material,
            core_weight,
            core_mask_thickness,
            estimated_casting_weight,
            estimated_bunch_weight,
            pattern_plate_thickness_sp,
            pattern_plate_weight_sp,
            core_mask_weight_sp,
            crush_pin_height_sp,
            calculated_yield_sp,
            pattern_plate_thickness_pp,
            pattern_plate_weight_pp,
            core_mask_weight_pp,
            crush_pin_height_pp,
            calculated_yield_pp,
            yield_label,
            tooling_remarks,
            tooling_created_at,
            tooling_updated_at,
            ...masterData
        } = row;

        const tooling = tooling_id ? {
            id: tooling_id,
            number_of_cavity,
            cavity_identification,
            pattern_material,
            core_weight,
            core_mask_thickness,
            estimated_casting_weight,
            estimated_bunch_weight,
            pattern_plate_thickness_sp,
            pattern_plate_weight_sp,
            core_mask_weight_sp,
            crush_pin_height_sp,
            calculated_yield_sp,
            pattern_plate_thickness_pp,
            pattern_plate_weight_pp,
            core_mask_weight_pp,
            crush_pin_height_pp,
            calculated_yield_pp,
            yield_label,
            remarks: tooling_remarks,
            created_at: tooling_created_at,
            updated_at: tooling_updated_at
        } : null;

        return {
            ...masterData,
            tooling
        };
    });

    res.status(200).json({ success: true, data: data[0] || null });
};

export const createMasterList = async (req, res, next) => {
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

    await Client.transaction(async (trx) => {
        const masterSql = `
            INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) 
            OUTPUT INSERTED.id
            VALUES (@pattern_code, @part_name, @material_grade, @chemical_composition, @micro_structure, @tensile, @impact, @hardness, @xray)
        `;

        const masterResult = await trx.query(masterSql, {
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

        const masterId = masterResult[0][0]?.id;

        if (masterId && tooling) {
            const toolingSql = `
                INSERT INTO tooling_pattern_data (
                    master_card_id,
                    number_of_cavity, cavity_identification, pattern_material,
                    core_weight, core_mask_thickness, estimated_casting_weight, estimated_bunch_weight,
                    pattern_plate_thickness_sp, pattern_plate_weight_sp, core_mask_weight_sp,
                    crush_pin_height_sp, calculated_yield_sp,
                    pattern_plate_thickness_pp, pattern_plate_weight_pp, core_mask_weight_pp,
                    crush_pin_height_pp, calculated_yield_pp,
                    yield_label, remarks
                ) VALUES (
                    @master_card_id,
                    @number_of_cavity, @cavity_identification, @pattern_material,
                    @core_weight, @core_mask_thickness, @estimated_casting_weight, @estimated_bunch_weight,
                    @pattern_plate_thickness_sp, @pattern_plate_weight_sp, @core_mask_weight_sp,
                    @crush_pin_height_sp, @calculated_yield_sp,
                    @pattern_plate_thickness_pp, @pattern_plate_weight_pp, @core_mask_weight_pp,
                    @crush_pin_height_pp, @calculated_yield_pp,
                    @yield_label, @remarks
                )
            `;

            await trx.query(toolingSql, {
                master_card_id: masterId,
                number_of_cavity: tooling.number_of_cavity,
                cavity_identification: tooling.cavity_identification,
                pattern_material: tooling.pattern_material,
                core_weight: tooling.core_weight,
                core_mask_thickness: tooling.core_mask_thickness,
                estimated_casting_weight: tooling.estimated_casting_weight,
                estimated_bunch_weight: tooling.estimated_bunch_weight,
                pattern_plate_thickness_sp: tooling.pattern_plate_thickness_sp,
                pattern_plate_weight_sp: tooling.pattern_plate_weight_sp,
                core_mask_weight_sp: tooling.core_mask_weight_sp,
                crush_pin_height_sp: tooling.crush_pin_height_sp,
                calculated_yield_sp: tooling.calculated_yield_sp,
                pattern_plate_thickness_pp: tooling.pattern_plate_thickness_pp,
                pattern_plate_weight_pp: tooling.pattern_plate_weight_pp,
                core_mask_weight_pp: tooling.core_mask_weight_pp,
                crush_pin_height_pp: tooling.crush_pin_height_pp,
                calculated_yield_pp: tooling.calculated_yield_pp,
                yield_label: tooling.yield_label,
                remarks: tooling.remarks
            });
        }
    });

    const audit_sql = 'INSERT INTO audit_log (user_id, department_id, action, remarks) VALUES (@user_id, @department_id, @action, @remarks)';
    await Client.query(audit_sql, {
        user_id: req.user.user_id,
        department_id: req.user.department_id,
        action: 'Master list created',
        remarks: `Master list ${pattern_code} created by ${req.user.username} with part name ${part_name}`
    });
    res.status(201).json({
        success: true,
        message: "Master list created successfully."
    });
};

export const updateMasterList = async (req, res, next) => {
    const { id } = req.params;
    const { pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray, tooling } = req.body || {};

    if (!pattern_code || !part_name) {
        throw new CustomError('Missing required fields', 400);
    }

    const chemicalCompositionStr = typeof chemical_composition === 'object'
        ? JSON.stringify(chemical_composition)
        : chemical_composition;

    await Client.transaction(async (trx) => {
        const masterSql = `UPDATE master_card SET pattern_code=@pattern_code, part_name=@part_name, material_grade=@material_grade, chemical_composition=@chemical_composition, micro_structure=@micro_structure, tensile=@tensile, impact=@impact, hardness=@hardness, xray=@xray WHERE id=@id`;
        await trx.query(masterSql, {
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

        if (tooling) {
            const checkSql = 'SELECT id FROM tooling_pattern_data WHERE master_card_id = @id';
            const checkResult = await trx.query(checkSql, { id });

            if (checkResult[0] && checkResult[0].length > 0) {
                const updateToolingSql = `
                    UPDATE tooling_pattern_data SET
                        number_of_cavity=@number_of_cavity, cavity_identification=@cavity_identification, pattern_material=@pattern_material,
                        core_weight=@core_weight, core_mask_thickness=@core_mask_thickness, estimated_casting_weight=@estimated_casting_weight, estimated_bunch_weight=@estimated_bunch_weight,
                        pattern_plate_thickness_sp=@pattern_plate_thickness_sp, pattern_plate_weight_sp=@pattern_plate_weight_sp, core_mask_weight_sp=@core_mask_weight_sp,
                        crush_pin_height_sp=@crush_pin_height_sp, calculated_yield_sp=@calculated_yield_sp,
                        pattern_plate_thickness_pp=@pattern_plate_thickness_pp, pattern_plate_weight_pp=@pattern_plate_weight_pp, core_mask_weight_pp=@core_mask_weight_pp,
                        crush_pin_height_pp=@crush_pin_height_pp, calculated_yield_pp=@calculated_yield_pp,
                        yield_label=@yield_label, remarks=@remarks,
                        updated_at=GETDATE()
                    WHERE master_card_id=@id
                `;
                await trx.query(updateToolingSql, {
                    number_of_cavity: tooling.number_of_cavity,
                    cavity_identification: tooling.cavity_identification,
                    pattern_material: tooling.pattern_material,
                    core_weight: tooling.core_weight,
                    core_mask_thickness: tooling.core_mask_thickness,
                    estimated_casting_weight: tooling.estimated_casting_weight,
                    estimated_bunch_weight: tooling.estimated_bunch_weight,
                    pattern_plate_thickness_sp: tooling.pattern_plate_thickness_sp,
                    pattern_plate_weight_sp: tooling.pattern_plate_weight_sp,
                    core_mask_weight_sp: tooling.core_mask_weight_sp,
                    crush_pin_height_sp: tooling.crush_pin_height_sp,
                    calculated_yield_sp: tooling.calculated_yield_sp,
                    pattern_plate_thickness_pp: tooling.pattern_plate_thickness_pp,
                    pattern_plate_weight_pp: tooling.pattern_plate_weight_pp,
                    core_mask_weight_pp: tooling.core_mask_weight_pp,
                    crush_pin_height_pp: tooling.crush_pin_height_pp,
                    calculated_yield_pp: tooling.calculated_yield_pp,
                    yield_label: tooling.yield_label,
                    remarks: tooling.remarks,
                    id
                });
            } else {
                const insertToolingSql = `
                    INSERT INTO tooling_pattern_data (
                        master_card_id,
                        number_of_cavity, cavity_identification, pattern_material,
                        core_weight, core_mask_thickness, estimated_casting_weight, estimated_bunch_weight,
                        pattern_plate_thickness_sp, pattern_plate_weight_sp, core_mask_weight_sp,
                        crush_pin_height_sp, calculated_yield_sp,
                        pattern_plate_thickness_pp, pattern_plate_weight_pp, core_mask_weight_pp,
                        crush_pin_height_pp, calculated_yield_pp,
                        yield_label, remarks
                    ) VALUES (
                        @id,
                        @number_of_cavity, @cavity_identification, @pattern_material,
                        @core_weight, @core_mask_thickness, @estimated_casting_weight, @estimated_bunch_weight,
                        @pattern_plate_thickness_sp, @pattern_plate_weight_sp, @core_mask_weight_sp,
                        @crush_pin_height_sp, @calculated_yield_sp,
                        @pattern_plate_thickness_pp, @pattern_plate_weight_pp, @core_mask_weight_pp,
                        @crush_pin_height_pp, @calculated_yield_pp,
                        @yield_label, @remarks
                    )
                `;
                await trx.query(insertToolingSql, {
                    id,
                    number_of_cavity: tooling.number_of_cavity,
                    cavity_identification: tooling.cavity_identification,
                    pattern_material: tooling.pattern_material,
                    core_weight: tooling.core_weight,
                    core_mask_thickness: tooling.core_mask_thickness,
                    estimated_casting_weight: tooling.estimated_casting_weight,
                    estimated_bunch_weight: tooling.estimated_bunch_weight,
                    pattern_plate_thickness_sp: tooling.pattern_plate_thickness_sp,
                    pattern_plate_weight_sp: tooling.pattern_plate_weight_sp,
                    core_mask_weight_sp: tooling.core_mask_weight_sp,
                    crush_pin_height_sp: tooling.crush_pin_height_sp,
                    calculated_yield_sp: tooling.calculated_yield_sp,
                    pattern_plate_thickness_pp: tooling.pattern_plate_thickness_pp,
                    pattern_plate_weight_pp: tooling.pattern_plate_weight_pp,
                    core_mask_weight_pp: tooling.core_mask_weight_pp,
                    crush_pin_height_pp: tooling.crush_pin_height_pp,
                    calculated_yield_pp: tooling.calculated_yield_pp,
                    yield_label: tooling.yield_label,
                    remarks: tooling.remarks
                });
            }
        }
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
};

export const bulkDeleteMasterList = async (req, res, next) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new CustomError('No IDs provided for deletion', 400);
    }

    await Client.transaction(async (trx) => {
        const params = {};
        const placeholders = ids.map((id, index) => {
            const paramName = `id${index}`;
            params[paramName] = id;
            return `@${paramName}`;
        });
        const sql = `DELETE FROM master_card WHERE id IN (${placeholders.join(',')})`;
        await trx.query(sql, params);
    });

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
};