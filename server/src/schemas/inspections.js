import { z } from 'zod';

const jsonValueSchema = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.record(z.string(), z.lazy(() => jsonValueSchema).optional()),
        z.array(z.lazy(() => jsonValueSchema)),
    ])
);

export const materialCorrectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    chemical_composition: jsonValueSchema.optional().nullable(),
    process_parameters: jsonValueSchema.optional().nullable(),
    remarks: z.string().optional().nullable(),
    is_edit: z.boolean().default(true)
});

export const pouringDetailsSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    pour_date: z.string({ required_error: "Pour Date is required" }).or(z.date({ required_error: "Pour Date is required" })),
    heat_code: z.string().optional().nullable(),
    composition: jsonValueSchema.optional().nullable(),
    no_of_mould_poured: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pouring_temp_c: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    pouring_time_sec: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    inoculation: jsonValueSchema.optional().nullable(),
    other_remarks: jsonValueSchema.optional().nullable(),
    remarks: z.string().optional().nullable(),
    is_edit: z.boolean().default(true),
    is_draft: z.boolean().default(false)
});

export const sandPropertiesSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    date: z.string({ required_error: "Date is required" }).or(z.date({ required_error: "Date is required" })),
    t_clay: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    a_clay: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    vcm: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    loi: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    afs: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    gcs: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    moi: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    compactability: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    permeability: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    remarks: z.string().optional().nullable(),
    is_edit: z.boolean().default(true),
    is_draft: z.boolean().default(false)
});

export const mouldCorrectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    mould_thickness: z.string().optional().nullable(),
    compressability: z.string().optional().nullable(),
    squeeze_pressure: z.string().optional().nullable(),
    mould_hardness: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    is_edit: z.boolean().default(true),
    is_draft: z.boolean().default(false),
    date: z.string({ required_error: "Date is required" }).or(z.date({ required_error: "Date is required" }))
});

export const metallurgicalInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string({ required_error: "Inspection Date is required" }).or(z.date({ required_error: "Inspection Date is required" })),
    micro_structure: jsonValueSchema.optional().nullable(),
    micro_structure_ok: z.boolean().optional().nullable(),
    micro_structure_remarks: z.string().optional().nullable(),
    mech_properties: jsonValueSchema.optional().nullable(),
    mech_properties_ok: z.boolean().optional().nullable(),
    mech_properties_remarks: z.string().optional().nullable(),
    impact_strength: jsonValueSchema.optional().nullable(),
    impact_strength_ok: z.boolean().optional().nullable(),
    impact_strength_remarks: z.string().optional().nullable(),
    hardness: jsonValueSchema.optional().nullable(),
    hardness_ok: z.boolean().optional().nullable(),
    hardness_remarks: z.string().optional().nullable(),
    is_edit: z.boolean().default(true),
    is_draft: z.boolean().default(false),
});

export const visualInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspections: jsonValueSchema.optional().nullable(),
    visual_ok: z.boolean().optional().nullable(),
    remarks: z.string().optional().nullable(),
    ndt_inspection: jsonValueSchema.optional().nullable(),
    ndt_inspection_ok: z.boolean().optional().nullable(),
    ndt_inspection_remarks: z.string().optional().nullable(),
    hardness: jsonValueSchema.optional().nullable(),
    hardness_ok: z.boolean().optional().nullable(),
    hardness_remarks: z.string().optional().nullable(),
    is_draft: z.boolean().default(false),
    is_edit: z.boolean().default(true)
});

export const dimensionalInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string({ required_error: "Inspection Date is required" }).or(z.date({ required_error: "Inspection Date is required" })),
    casting_weight: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    bunch_weight: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    no_of_cavities: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    yields: z.preprocess((v) => (v === "" || v === null ? null : Number(v)), z.number().positive().nullable().optional()),
    inspections: jsonValueSchema.optional().nullable(),
    remarks: z.string().optional().nullable(),
    is_draft: z.boolean().default(false),
    is_edit: z.boolean().default(true)
});

export const machineShopSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string({ required_error: "Inspection Date is required" }).or(z.date({ required_error: "Inspection Date is required" })),
    inspections: jsonValueSchema.optional().nullable(),
    remarks: z.string().optional().nullable(),
    is_draft: z.boolean().default(false),
    is_edit: z.boolean().default(true)
});

export const updateMaterialCorrectionSchema = materialCorrectionSchema.partial();
export const updatePouringDetailsSchema = pouringDetailsSchema.partial();
export const updateSandPropertiesSchema = sandPropertiesSchema.partial();
export const updateMouldCorrectionSchema = mouldCorrectionSchema.partial();
export const updateMetallurgicalInspectionSchema = metallurgicalInspectionSchema.partial();
export const updateVisualInspectionSchema = visualInspectionSchema.partial();
export const updateDimensionalInspectionSchema = dimensionalInspectionSchema.partial();
export const updateMachineShopSchema = machineShopSchema.partial();
