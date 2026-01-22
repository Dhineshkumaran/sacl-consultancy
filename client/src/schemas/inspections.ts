import { z } from 'zod';

export const materialCorrectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    chemical_composition: z.any().optional().nullable(),
    process_parameters: z.any().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export const pouringDetailsSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    pour_date: z.string().or(z.date()),
    heat_code: z.string().optional().nullable(),
    composition: z.any().optional().nullable(),
    no_of_mould_poured: z.union([z.number(), z.string()])
        .transform(v => (v === "" || v === null) ? null : Number(v))
        .refine(n => n === null || n > 0, "Must be greater than 0")
        .optional().nullable(),
    pouring_temp_c: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Temperature must be greater than 0").optional().nullable(),
    pouring_time_sec: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Time must be greater than 0").optional().nullable(),
    inoculation: z.string().optional().nullable(),
    other_remarks: z.string().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export const sandPropertiesSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    date: z.string().or(z.date()),
    t_clay: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    a_clay: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    vcm: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    loi: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    afs: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    gcs: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    moi: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    compactability: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    permeability: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    remarks: z.string().optional().nullable()
});

export const mouldCorrectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    mould_thickness: z.string().optional().nullable(),
    compressability: z.string().optional().nullable(),
    squeeze_pressure: z.string().optional().nullable(),
    mould_hardness: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    date: z.string().or(z.date())
});

export const metallurgicalInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string().or(z.date()),
    micro_structure: z.any().optional().nullable(),
    micro_structure_ok: z.boolean().optional().nullable(),
    micro_structure_remarks: z.string().optional().nullable(),
    mech_properties: z.any().optional().nullable(),
    mech_properties_ok: z.boolean().optional().nullable(),
    mech_properties_remarks: z.string().optional().nullable(),
    impact_strength: z.any().optional().nullable(),
    impact_strength_ok: z.boolean().optional().nullable(),
    impact_strength_remarks: z.string().optional().nullable(),
    hardness: z.any().optional().nullable(),
    hardness_ok: z.boolean().optional().nullable(),
    hardness_remarks: z.string().optional().nullable(),
    ndt_inspection: z.any().optional().nullable(),
    ndt_inspection_ok: z.boolean().optional().nullable(),
    ndt_inspection_remarks: z.string().optional().nullable()
});

export const visualInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspections: z.any().optional().nullable(),
    visual_ok: z.boolean().or(z.string().transform(v => v === 'true')),
    remarks: z.string().optional().nullable()
});

export const dimensionalInspectionSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string().or(z.date()),
    casting_weight: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    bunch_weight: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    no_of_cavities: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    yields: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    inspections: z.any().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export const machineShopSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required"),
    inspection_date: z.string().or(z.date()),
    inspections: z.any().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export type MaterialCorrectionInput = z.infer<typeof materialCorrectionSchema>;
export type PouringDetailsInput = z.infer<typeof pouringDetailsSchema>;
export type SandPropertiesInput = z.infer<typeof sandPropertiesSchema>;
export type MouldCorrectionInput = z.infer<typeof mouldCorrectionSchema>;
export type MetallurgicalInspectionInput = z.infer<typeof metallurgicalInspectionSchema>;
export type VisualInspectionInput = z.infer<typeof visualInspectionSchema>;
export type DimensionalInspectionInput = z.infer<typeof dimensionalInspectionSchema>;
export type MachineShopInput = z.infer<typeof machineShopSchema>;
