import { z } from 'zod';

export const masterCardSchema = z.object({
    pattern_code: z.string().min(1, "Pattern Code is required").max(150, "Pattern Code too long"),
    part_name: z.string().min(1, "Part Name is required").max(200, "Part Name too long"),
    material_grade: z.string().max(100, "Material Grade too long").optional().nullable(),
    chemical_composition: z.record(z.string(), z.string()).optional().nullable(),
    micro_structure: z.string().optional().nullable(),
    tensile: z.string().optional().nullable(),
    impact: z.string().optional().nullable(),
    hardness: z.string().optional().nullable(),
    xray: z.string().optional().nullable(),
    number_of_cavity: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    pattern_material: z.string().max(100, "Pattern Material must be 100 characters or less").optional().nullable(),
    core_weight: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    estimated_casting_weight: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    estimated_bunch_weight: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    yield_label: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Must be greater than 0").optional().nullable(),
    remarks: z.string().optional().nullable()
});

export type MasterCardInput = z.infer<typeof masterCardSchema>;
