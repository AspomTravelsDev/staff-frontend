"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth/api";
import { setSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = {
    error?: string;
} | null;

export async function loginAction(
    prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
    };

    // Validate input
    const validatedFields = loginSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { email, password } = validatedFields.data;

    // Call API
    const result = await login(email, password);

    if (!result.success) {
        return { error: result.error.error };
    }

    // Store token and user in cookies
    await setSession(result.data.token, result.data.user);

    redirect("/dashboard");
}
