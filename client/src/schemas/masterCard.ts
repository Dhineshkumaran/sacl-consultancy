import { z } from 'zod';

const jsonValueSchema: z.ZodType<any> = z.lazy(() =>
    z.union([
        z.string(),
        z.number(),
        z.boolean(),
        z.null(),
        z.record(z.string(), jsonValueSchema.optional()),
        z.array(jsonValueSchema),
    ])
);

export const masterCardSchema = z.object({
    pattern_code: z.string().min(1, "Pattern Code is required").max(150, "Pattern Code too long"),
    part_name: z.string().min(1, "Part Name is required").max(200, "Part Name too long"),
    material_grade: z.string().max(100, "Material Grade too long").optional().nullable(),
    chemical_composition: z.record(z.string(), jsonValueSchema).optional().nullable(),
    micro_structure: z.string().optional().nullable(),
    tensile: z.string().optional().nullable(),
    yield: z.string().optional().nullable(),
    elongation: z.string().optional().nullable(),
    impact_cold: z.string().optional().nullable(),
    impact_room: z.string().optional().nullable(),
    hardness_surface: z.string().optional().nullable(),
    hardness_core: z.string().optional().nullable(),
    xray: z.string().optional().nullable(),
    mpi: z.string().optional().nullable(),
    number_of_cavity: z.string().optional().nullable(),
    cavity_identification: z.string().optional().nullable(),
    pattern_material: z.string().max(100, "Pattern Material must be 100 characters or less").optional().nullable(),
    core_weight: z.string().optional().nullable(),
    core_mask_thickness: z.string().optional().nullable(),
    estimated_casting_weight: z.string().optional().nullable(),
    estimated_bunch_weight: z.string().optional().nullable(),
    pattern_plate_thickness_sp: z.string().optional().nullable(),
    pattern_plate_weight_sp: z.string().optional().nullable(),
    core_mask_weight_sp: z.string().optional().nullable(),
    crush_pin_height_sp: z.string().optional().nullable(),
    pattern_plate_thickness_pp: z.string().optional().nullable(),
    pattern_plate_weight_pp: z.string().optional().nullable(),
    crush_pin_height_pp: z.string().optional().nullable(),
    yield_label: z.string().optional().nullable(),
    remarks: z.string().optional().nullable()
});

export type MasterCardInput = z.infer<typeof masterCardSchema>;
