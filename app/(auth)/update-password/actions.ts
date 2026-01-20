"use server";

import { updatePassword } from "@/lib/auth/api";
import { updatePasswordSchema } from "@/lib/validations/auth";

export type UpdatePasswordState = {
    error?: string;
    success?: boolean;
    message?: string;
} | null;

export async function updatePasswordAction(
    prevState: UpdatePasswordState,
    formData: FormData
): Promise<UpdatePasswordState> {
    const rawData = {
        token: formData.get("token") as string,
        password: formData.get("password") as string,
        password_confirmation: formData.get("password_confirmation") as string,
    };

    // Validate input
    const validatedFields = updatePasswordSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { token, password, password_confirmation } = validatedFields.data;

    // Call API
    const result = await updatePassword(token, password, password_confirmation);

    if (!result.success) {
        return { error: result.error.error };
    }

    return { success: true, message: result.data.message };
}
