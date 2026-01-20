import { cookies } from "next/headers";
import { User, validateToken } from "./api";

const AUTH_COOKIE_NAME = "auth_token";
const USER_COOKIE_NAME = "auth_user";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
};

/**
 * Set auth session (token + user data)
 */
export async function setSession(token: string, user: User): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(user), {
        ...COOKIE_OPTIONS,
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
        // Token is invalid, clear session
        await clearSession();
        return null;
    }

    return result.data;
}
