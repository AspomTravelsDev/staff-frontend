"use server";

import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/auth/api";
import { setSession } from "@/lib/auth/session";
import { acceptInviteSchema } from "@/lib/validations/auth";

export type AcceptInviteState = {
    error?: string;
} | null;

export async function acceptInviteAction(
    prevState: AcceptInviteState,
    formData: FormData
): Promise<AcceptInviteState> {
    const rawData = {
        token: formData.get("token") as string,
        password: formData.get("password") as string,
        password_confirmation: formData.get("password_confirmation") as string,
    };

    // Validate input
    const validatedFields = acceptInviteSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { token, password, password_confirmation } = validatedFields.data;

    const result = await acceptInvite(token, password, password_confirmation);

    if (!result.success) {
        return { error: result.error.error };
    }

    // Store token and user in cookies
    await setSession(result.data.token, result.data.user);

    redirect("/dashboard");
}
