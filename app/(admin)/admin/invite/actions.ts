"use server";

import { sendInvite } from "@/lib/auth/api";
import { getAuthToken } from "@/lib/auth/session";
import { inviteSchema } from "@/lib/validations/auth";

export type InviteState = {
    error?: string;
    success?: boolean;
    message?: string;
    invite_url?: string;
} | null;

export async function inviteAction(
    prevState: InviteState,
    formData: FormData
): Promise<InviteState> {
    const rawData = {
        email: formData.get("email") as string,
        role: formData.get("role") as string,
    };

    // Validate input
    const validatedFields = inviteSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { email, role } = validatedFields.data;

    // Call API with auth token
    const token = await getAuthToken();
    const result = await sendInvite(email, role, token ?? undefined);

    if (!result.success) {
        return { error: result.error.error };
    }

    return { success: true, message: result.data.message, invite_url: result.data.invite_url };
}
