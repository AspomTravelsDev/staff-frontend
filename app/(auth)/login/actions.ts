"use server";


import { safeReturnPath } from "@/lib/auth/return-path";
import { login } from "@/lib/auth/api";
import { setSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { headers } from "next/headers";
import { ATTENDANCE_CONFIG } from "@/lib/config/attendance";

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
        deviceData: {
            device_uuid: (formData.get("device_uuid") as string) || undefined,
            device_fingerprint: (formData.get("device_fingerprint") as string) || undefined,
            device_name: (formData.get("device_name") as string) || undefined,
        }
    };

    const validatedFields = loginSchema.safeParse({ email: rawData.email, password: rawData.password });

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const firstError = Object.values(errors)[0]?.[0];
        return { error: firstError || "Invalid input" };
    }

    const { email, password } = validatedFields.data;

    const skipClockIn =
        !ATTENDANCE_CONFIG.isLoginAutoClockInEnabled() ||
        formData.get("skip_clock_in") === "true";
    const rememberMe = formData.get("remember") === "on" || formData.get("remember") === "true";

    // Call API
    const result = await login(
        email,
        password,
        skipClockIn ? undefined : rawData.location,
        rawData.client_ip,
        rawData.deviceData,
        skipClockIn,
        rememberMe
    );

    if (!result.success) {
        const errorCode = result.error.code;
        const errorMessage = ERROR_MESSAGES[errorCode] || result.error.error || "An error occurred during login.";
        return { error: errorMessage };
    }

    // Store token and user in cookies
    await setSession(result.data.token, result.data.user, rememberMe);

    const redirectPath = formData.get("redirect") as string;
    const destination = safeReturnPath(redirectPath);

    return {
        success: true,
        destination,
        clocked_in: result.data.clocked_in,
        clock_in_message: skipClockIn ? null : result.data.clock_in_message
    };
}
