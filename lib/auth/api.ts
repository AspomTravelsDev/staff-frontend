/**
 * Auth API
 *
 * These functions handle authentication with the backend.
 */

import { api, type ApiResponse } from "@/lib/api/client";
import { type User, type LoginUser } from "@/types/user-types";

export interface AuthResponse {
    token: string;
    user: LoginUser;
    clocked_in?: boolean;
    clock_in_message?: string | null;
}

export interface MessageResponse {
    message: string;
}

export interface ResetPasswordResponse {
    message: string;
    reset_url?: string | null;
}

export interface InviteResponse {
    message: string;
    invite_url?: string;
}

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy: number;
}

/**
 * POST /api/auth/login
 * Request: { email: string, password: string, location?: LocationData, client_ip?: string }
 * Success: { token: string, user: LoginUser }
 * Error: { error: string, code: "INVALID_CREDENTIALS" | "ACCOUNT_DISABLED" | "LOCATION_RESTRICTED" }
 */
export async function login(
    email: string,
    password: string,
    location?: LocationData,
    client_ip?: string
): Promise<ApiResponse<AuthResponse>> {
    return api.post<AuthResponse>("/api/login", { email, password, location, client_ip });
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
export async function resetPassword(email: string): Promise<ApiResponse<ResetPasswordResponse>> {
    return api.post<ResetPasswordResponse>("/api/forgot-password", { email });
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
export interface InviteData {
    email: string;
    role: string;
    is_supervisor?: boolean;
    department?: string;
    date_joined?: string;
    staff_id?: string;
}

/**
 * POST /api/auth/invite
 * Request: InviteData
 * Success: { message: string }
 * Error: { error: string, code: "USER_EXISTS" | "INVALID_ROLE" | "FORBIDDEN" }
 */
export async function sendInvite(
    data: InviteData,
    token?: string
): Promise<ApiResponse<InviteResponse>> {
    return api.post<InviteResponse>(
        "/api/invite",
        data,
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
 * GET /api/invites
 * Get all pending invites
 */
export interface InviteRecord extends InviteData {
    id: string;
    token: string;
    used: boolean;
    expires_at: string;
    created_at: string;
    updated_at: string;
}

export async function getInvites(token?: string): Promise<ApiResponse<{ data: InviteRecord[] }>> {
    return api.get<{ data: InviteRecord[] }>("/api/invites", { token });
}

/**
 * DELETE /api/invites/{id}
 * Cancel an invite
 */
export async function deleteInvite(id: string, token?: string): Promise<ApiResponse<MessageResponse>> {
    return api.delete<MessageResponse>(`/api/invites/${id}`, { token });
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
