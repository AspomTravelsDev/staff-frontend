"use server";

import { resetPassword } from "@/lib/auth/api";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ResetPasswordState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

export async function resetPasswordAction(
    prevState: ResetPasswordState,
    formData: FormData
): Promise<ResetPasswordState> {
    const rawData = {
        email: formData.get("email") as string,
    };

    // Validate input
    const validatedFields = resetPasswordSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { email } = validatedFields.data;

    // Call API
    const result = await resetPassword(email);

    if (!result.success) {
        return { error: result.error.error };
    }

    return { success: true, message: result.data.message };
}
