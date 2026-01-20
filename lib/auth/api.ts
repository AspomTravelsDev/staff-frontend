/**
 * Simulated Auth API
 *
 * These functions simulate backend API calls for authentication.
 * Replace with actual fetch calls when Laravel backend is ready.
 *
 * Expected Laravel endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - POST /api/auth/reset-password
 * - POST /api/auth/update-password
 * - POST /api/auth/invite
 * - POST /api/auth/accept-invite
 */

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MessageResponse {
    message: string;
}

export interface ErrorResponse {
    error: string;
    code: string;
}

type ApiResponse<T> = { success: true; data: T } | { success: false; error: ErrorResponse };

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * POST /api/auth/login
 * Request: { email: string, password: string }
 * Success: { token: string, user: User }
 * Error: { error: string, code: "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" }
 */
export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    await delay(1000);

    // Simulate validation
    if (email === "test@aspom.com" && password === "password123") {
        return {
            success: true,
            data: {
                token: "simulated-jwt-token-" + Date.now(),
                user: {
                    id: "1",
                    name: "Test User",
                    email: email,
                    role: "admin",
                },
            },
        };
    }

    return {
        success: false,
        error: {
            error: "Invalid email or password",
            code: "INVALID_CREDENTIALS",
        },
    };
}

/**
 * POST /api/auth/logout
 * Request: -
 * Success: { message: string }
 * Error: { error: string, code: "UNAUTHENTICATED" }
 */
export async function logout(): Promise<ApiResponse<MessageResponse>> {
    await delay(500);

    return {
        success: true,
        data: {
            message: "Successfully logged out",
        },
    };
}

/**
 * POST /api/auth/reset-password
 * Request: { email: string }
 * Success: { message: string }
 * Error: { error: string, code: "USER_NOT_FOUND" | "RATE_LIMITED" }
 */
export async function resetPassword(email: string): Promise<ApiResponse<MessageResponse>> {
    await delay(1000);

    // Simulate success for any valid email format
    if (email.includes("@")) {
        return {
            success: true,
            data: {
                message: "If an account exists with this email, you will receive a password reset link.",
            },
        };
    }

    return {
        success: false,
        error: {
            error: "Please enter a valid email address",
            code: "INVALID_EMAIL",
        },
    };
}

/**
 * POST /api/auth/update-password
 * Request: { token: string, password: string, password_confirmation: string }
 * Success: { message: string }
 * Error: { error: string, code: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "PASSWORD_TOO_WEAK" }
 */
export async function updatePassword(
    token: string,
    password: string,
    passwordConfirmation: string
): Promise<ApiResponse<MessageResponse>> {
    await delay(1000);

    // Simulate token validation
    if (!token || token === "invalid") {
        return {
            success: false,
            error: {
                error: "This password reset link is invalid or has expired",
                code: "INVALID_TOKEN",
            },
        };
    }

    if (password !== passwordConfirmation) {
        return {
            success: false,
            error: {
                error: "Passwords do not match",
                code: "PASSWORD_MISMATCH",
            },
        };
    }

    return {
        success: true,
        data: {
            message: "Your password has been updated successfully. You can now log in.",
        },
    };
}

/**
 * POST /api/auth/invite
 * Request: { email: string, role: string }
 * Success: { message: string }
 * Error: { error: string, code: "USER_EXISTS" | "INVALID_ROLE" | "FORBIDDEN" }
 */
export async function sendInvite(email: string, role: string): Promise<ApiResponse<MessageResponse>> {
    await delay(1000);

    // Simulate existing user check
    if (email === "existing@aspom.com") {
        return {
            success: false,
            error: {
                error: "A user with this email already exists",
                code: "USER_EXISTS",
            },
        };
    }

    return {
        success: true,
        data: {
            message: `Invitation sent to ${email} as ${role}`,
        },
    };
}

/**
 * POST /api/auth/accept-invite
 * Request: { token: string, password: string, password_confirmation: string }
 * Success: { token: string, user: User }
 * Error: { error: string, code: "INVALID_TOKEN" | "TOKEN_EXPIRED" | "INVITE_ALREADY_ACCEPTED" }
 */
export async function acceptInvite(
    token: string,
    password: string,
    passwordConfirmation: string
): Promise<ApiResponse<AuthResponse>> {
    await delay(1000);

    // Simulate token validation
    if (!token || token === "invalid") {
        return {
            success: false,
            error: {
                error: "This invitation link is invalid or has expired",
                code: "INVALID_TOKEN",
            },
        };
    }

    if (password !== passwordConfirmation) {
        return {
            success: false,
            error: {
                error: "Passwords do not match",
                code: "PASSWORD_MISMATCH",
            },
        };
    }

    return {
        success: true,
        data: {
            token: "simulated-jwt-token-" + Date.now(),
            user: {
                id: "2",
                name: "New Staff",
                email: "newstaff@aspom.com",
                role: "staff",
            },
        },
    };
}
