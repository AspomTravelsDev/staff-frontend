/**
 * Auth API
 *
 * These functions handle authentication with the backend.
 * Currently using simulated responses for development.
 *
 * Laravel endpoints:
 * - POST /api/auth/login
 * - POST /api/auth/logout
 * - POST /api/auth/reset-password
 * - POST /api/auth/update-password
 * - POST /api/auth/invite
 * - POST /api/auth/accept-invite
 * - GET  /api/auth/user (validate token & get current user)
 *
 * TODO: When backend is ready:
 * 1. Set USE_REAL_API to true
 * 2. Ensure NEXT_PUBLIC_API_URL is set in .env
 * 3. Remove simulated functions
 */

import {
    findUserByEmail,
    findUserByToken,
    getTokenForUser,
} from "@/lib/api/mock-loader";

// Toggle this to switch between simulated and real API
const USE_REAL_API = false;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
    id: string;
    name: string;
    email: string;
    role: "super" | "admin" | "it" | "account" | "visa" | "hr" | "media" | "compliance";
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

// Simulate network delay (remove when using real API)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper function to make authenticated API requests
 * TODO: Use this for all authenticated endpoints
 */
async function fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    error: data.message || data.error || "An error occurred",
                    code: data.code || "UNKNOWN_ERROR",
                },
            };
        }

        return { success: true, data };
    } catch {
        return {
            success: false,
            error: {
                error: "Network error. Please check your connection.",
                code: "NETWORK_ERROR",
            },
        };
    }
}

/**
 * POST /api/auth/login
 * Request: { email: string, password: string }
 * Success: { token: string, user: User }
 * Error: { error: string, code: "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" }
 */
export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    // TODO: Remove simulation when backend is ready
    if (!USE_REAL_API) {
        await delay(800);

        // Look up user in mock data (data/mock/auth.json)
        const mockUser = await findUserByEmail(email);

        if (mockUser && mockUser.password === password) {
            const token = await getTokenForUser(mockUser.id);
            return {
                success: true,
                data: {
                    token: token || `mock-token-${mockUser.id}`,
                    user: {
                        id: mockUser.id,
                        name: mockUser.name,
                        email: mockUser.email,
                        role: mockUser.role,
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

    // Real API call
    return fetchWithAuth<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

/**
 * POST /api/auth/logout
 * Request: -
 * Success: { message: string }
 * Error: { error: string, code: "UNAUTHENTICATED" }
 */
export async function logout(token?: string): Promise<ApiResponse<MessageResponse>> {
    if (!USE_REAL_API) {
        await delay(500);
        return {
            success: true,
            data: { message: "Successfully logged out" },
        };
    }

    return fetchWithAuth<MessageResponse>(
        "/api/auth/logout",
        { method: "POST" },
        token
    );
}

/**
 * POST /api/auth/reset-password
 * Request: { email: string }
 * Success: { message: string }
 * Error: { error: string, code: "USER_NOT_FOUND" | "RATE_LIMITED" }
 */
export async function resetPassword(email: string): Promise<ApiResponse<MessageResponse>> {
    if (!USE_REAL_API) {
        await delay(1000);

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

    return fetchWithAuth<MessageResponse>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
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
    if (!USE_REAL_API) {
        await delay(1000);

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

    return fetchWithAuth<MessageResponse>("/api/auth/update-password", {
        method: "POST",
        body: JSON.stringify({
            token,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });
}

/**
 * POST /api/auth/invite
 * Request: { email: string, role: string }
 * Success: { message: string }
 * Error: { error: string, code: "USER_EXISTS" | "INVALID_ROLE" | "FORBIDDEN" }
 */
export async function sendInvite(
    email: string,
    role: string,
    token?: string
): Promise<ApiResponse<MessageResponse>> {
    if (!USE_REAL_API) {
        await delay(1000);

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
            data: { message: `Invitation sent to ${email} as ${role}` },
        };
    }

    return fetchWithAuth<MessageResponse>(
        "/api/auth/invite",
        {
            method: "POST",
            body: JSON.stringify({ email, role }),
        },
        token
    );
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
    if (!USE_REAL_API) {
        await delay(1000);

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
                    email: "newstaff@aspomtravels.com",
                    role: "visa",
                },
            },
        };
    }

    return fetchWithAuth<AuthResponse>("/api/auth/accept-invite", {
        method: "POST",
        body: JSON.stringify({
            token,
            password,
            password_confirmation: passwordConfirmation,
        }),
    });
}

/**
 * GET /api/auth/user
 * Validate token and get current user
 * Success: User
 * Error: { error: string, code: "UNAUTHENTICATED" }
 */
export async function validateToken(token: string): Promise<ApiResponse<User>> {
    if (!USE_REAL_API) {
        await delay(100);

        // Look up user by token in mock data (data/mock/auth.json)
        const mockUser = await findUserByToken(token);

        if (mockUser) {
            return {
                success: true,
                data: {
                    id: mockUser.id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                },
            };
        }

        return {
            success: false,
            error: {
                error: "Invalid or expired token",
                code: "UNAUTHENTICATED",
            },
        };
    }

    return fetchWithAuth<User>("/api/auth/user", { method: "GET" }, token);
}
