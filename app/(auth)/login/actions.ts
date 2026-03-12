"use server";


import { login } from "@/lib/auth/api";
import { setSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { headers } from "next/headers";

export type LoginState = {
    error?: string;
    success?: boolean;
    destination?: string;
    clocked_in?: boolean;
    clock_in_message?: string | null;
} | null;

const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: "Wrong email or password.",
    ACCOUNT_DISABLED: "Your account is disabled. Please contact an administrator.",
    LOCATION_RESTRICTED: "Attendance not recorded. Not within office premises and not connected to office WiFi.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    HTTP_429: "Too many login attempts. Please wait a minute before trying again."
};

export async function loginAction(
    prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const headerStack = await headers();
    const xForwardedFor = headerStack.get("x-forwarded-for");
    const clientIpFromFormData = formData.get("client_ip") as string;

    const rawData = {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        location: formData.get("location")
            ? JSON.parse(formData.get("location") as string)
            : undefined,
        client_ip: clientIpFromFormData || xForwardedFor || undefined,
    };

    const validatedFields = loginSchema.safeParse({ email: rawData.email, password: rawData.password });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { email, password } = validatedFields.data;

    console.log(rawData.location, rawData.client_ip)
    // Call API
    const result = await login(email, password, rawData.location, rawData.client_ip);

    if (!result.success) {
        const errorCode = result.error.code;
        const errorMessage = ERROR_MESSAGES[errorCode] || result.error.error || "An error occurred during login.";
        return { error: errorMessage };
    }

    // Store token and user in cookies
    await setSession(result.data.token, result.data.user);

    const redirectPath = formData.get("redirect") as string;
    const destination =
        redirectPath && redirectPath.startsWith("/") ? redirectPath : "/dashboard";

    return {
        success: true,
        destination,
        clocked_in: result.data.clocked_in,
        clock_in_message: result.data.clock_in_message
    };
}
