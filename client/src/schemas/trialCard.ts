import { z } from 'zod';

export const trialCardSchema = z.object({
    trial_id: z.string().min(1, "Trial ID is required").max(255),
    part_name: z.string().min(1, "Part Name is required").max(100),
    pattern_code: z.string().min(1, "Pattern Code is required").max(150),
    material_grade: z.string().min(1, "Material Grade is required").max(50),
    trial_type: z.enum(['INHOUSE MACHINING(NPD)', 'INHOUSE MACHINING(REGULAR)', 'MACHINING - CUSTOMER END'], {
        message: "Please select a valid Trial Type"
    }).default('INHOUSE MACHINING(NPD)'),
    initiated_by: z.string().min(1, "Initiated by is required").max(50),
    date_of_sampling: z.string().or(z.date()),
    plan_moulds: z.union([z.number(), z.string()]).transform(v => (v === "" || v === null) ? null : Number(v)).refine(n => n === null || n > 0, "Plan moulds must be greater than 0").optional().nullable(),
    reason_for_sampling: z.string().optional().nullable(),
    status: z.enum(['CREATED', 'IN_PROGRESS', 'CLOSED'], {
        message: "Invalid status selected"
    }).default('CREATED'),
    tooling_modification: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    current_department_id: z.number().int().optional().nullable(),
    disa: z.string().max(50, "Disa must be 50 characters or less").optional().nullable(),
    sample_traceability: z.string().max(50, "Sample Traceability must be 50 characters or less").optional().nullable(),
    mould_correction: z.any().optional().nullable(),
    is_edit: z.boolean().default(true)
});

export type TrialCardInput = z.infer<typeof trialCardSchema>;
