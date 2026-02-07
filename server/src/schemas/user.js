import { z } from 'zod';

export const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(50),
    full_name: z.string().min(1, "Full name is required").max(100),
    email: z.string().email("Invalid email address").max(100).optional().nullable(),
    password: z.string().optional(),
    department_id: z.number().int().optional().nullable(),
    role: z.enum(['User', 'HOD', 'Admin']).default('User'),
    machine_shop_user_type: z.enum(['N/A', 'NPD', 'REGULAR']).default('N/A'),
    is_active: z.boolean().default(true),
    remarks: z.string().optional().nullable()
});

export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
});

export const changePasswordSchema = z.object({
    newPassword: z.string().min(6, "New password must be at least 6 characters")
});
