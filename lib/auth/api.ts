/**
 * Auth API
 *
 * These functions handle authentication with the backend.
 */

import { api, type ApiResponse } from "@/lib/api/client";

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
};

export interface AuthResponse {
    token: string;
    user: User;
}

export interface MessageResponse {
    message: string;
}

export interface InviteResponse {
    message: string;
    invite_url?: string;
}

/**
 * POST /api/auth/login
 * Request: { email: string, password: string }
 * Success: { token: string, user: User }
 * Error: { error: string, code: "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" }
 */
export async function login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>("/api/login", { email, password });
}

/**
 * POST /api/auth/logout
 * Request: -
 * Success: { message: string }
 * Error: { error: string, code: "UNAUTHENTICATED" }
 */
export async function logout(token?: string): Promise<ApiResponse<MessageResponse>> {
    return api.post<MessageResponse>("/api/logout", undefined, { token });
}

/**
 * POST /api/auth/reset-password
 * Request: { email: string }
 * Success: { message: string }
 * Error: { error: string, code: "USER_NOT_FOUND" | "RATE_LIMITED" }
 */
export async function resetPassword(email: string): Promise<ApiResponse<MessageResponse>> {
    return api.post<MessageResponse>("/api/forgot-password", { email });
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
    return api.post<MessageResponse>("/api/reset-password", {
        token,
        password,
        password_confirmation: passwordConfirmation,
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
): Promise<ApiResponse<InviteResponse>> {
    return api.post<InviteResponse>(
        "/api/invite",
        { email, role },
        { token }
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
    name: string,
    password: string,
    passwordConfirmation: string
): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>("/api/accept-invite", {
        token,
        name,
        password,
        password_confirmation: passwordConfirmation,
    });
}

/**
 * GET /api/auth/user
 * Validate token and get current user
 * Success: User
 * Error: { error: string, code: "UNAUTHENTICATED" }
 */
export async function validateToken(token: string): Promise<ApiResponse<User>> {
    return api.get<User>("/api/user", { token });
}
