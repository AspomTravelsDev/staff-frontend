import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export const updatePasswordSchema = z
    .object({
        token: z.string().min(1, "Token is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        password_confirmation: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"],
    });

export const acceptInviteSchema = z
    .object({
        token: z.string().min(1, "Token is required"),
        name: z.string().min(1, "Name is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        password_confirmation: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: "Passwords do not match",
        path: ["password_confirmation"],
    });

export function createInviteSchema(validRoles?: string[]) {
    const allowedRoles = new Set(validRoles ?? []);
    const enforceRoleAllowList = allowedRoles.size > 0;

    return z.object({
        email: z.string().email("Please enter a valid email address"),
        role: z
            .string()
            .min(1, "Please select a role")
            .refine(
                (role) => !enforceRoleAllowList || allowedRoles.has(role),
                "Please select a valid role"
            ),
        is_supervisor: z.boolean().optional().default(false),
        department: z.string().optional(), // Can be obtained from role, but editable
        date_joined: z.string().optional(), // ISO date string (YYYY-MM-DD)
        staff_id: z.string().optional(),
        is_department_account: z.boolean().optional().default(false),
    });
}

export const inviteSchema = createInviteSchema();

export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
