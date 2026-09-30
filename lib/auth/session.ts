import { cookies } from "next/headers";
import { validateToken } from "./api";
import { User, LoginUser } from "@/types/user-types";

const AUTH_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "auth_user";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 15 * 60 * 60, // 15 hours
    path: "/",
};

/**
 * Set auth session (token + user data)
 */
export async function setSession(
    token: string,
    user: User | LoginUser,
    rememberMe = false,
): Promise<void> {
    const cookieStore = await cookies();
    const cookieOptions = {
        ...COOKIE_OPTIONS,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : COOKIE_OPTIONS.maxAge,
    };

    cookieStore.set(AUTH_COOKIE_NAME, token, cookieOptions);
    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
        ...cookieOptions,
        httpOnly: false, // Allow client-side access to user data if needed
    });
}

/**
 * Get auth token from cookies
 */
export async function getAuthToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * Clear auth session
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.delete(AUTH_COOKIE_NAME);
    cookieStore.delete(USER_COOKIE_NAME);
}

/**
 * Get current user from session
 * Validates token with backend when USE_REAL_API is enabled
 */
export async function getCurrentUser(): Promise<User | null> {
    const token = await getAuthToken();

    if (!token) {
        return null;
    }

    // Validate token with backend
    const result = await validateToken(token);

    if (!result.success) {
        // Token is invalid - cannot clear session here (Next.js restriction)
        // Session will be cleared by the logout route handler
        return null;
    }

    return result.data;
}
