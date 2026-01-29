/**
 * Centralized API Client
 *
 * Provides a typed fetch wrapper with automatic authentication,
 * error handling, and mock mode support for development.
 */

import { getAuthToken } from "@/lib/auth/session";

// Remove debug logs and USE_REAL_API
export const USE_REAL_API = true; // Deprecated, always true
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ErrorResponse {
    error: string;
    code: string;
}

export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ErrorResponse };

export interface RequestConfig extends Omit<RequestInit, "body"> {
    body?: unknown;
    /**
     * Skip automatic token injection (for public endpoints)
     */
    skipAuth?: boolean;
    /**
     * Custom token override (useful for server actions with pre-fetched tokens)
     */
    token?: string;
}

/**
 * Build headers for API requests
 */
function buildHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

export async function apiClient<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<ApiResponse<T>> {
    const { body, skipAuth, token: customToken, ...fetchOptions } = config;

    // Get auth token if not skipped
    let token: string | null = null;
    if (!skipAuth) {
        token = customToken ?? (await getAuthToken());
    }

    const headers = {
        ...buildHeaders(token),
        ...fetchOptions.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            cache: fetchOptions.cache ?? "no-store",
        });

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return { success: true, data: null as T };
        }

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    error: data.message || data.error || "An error occurred",
                    code: data.code || `HTTP_${response.status}`,
                },
            };
        }

        return { success: true, data };
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
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
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: <T>(endpoint: string, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: "GET" }),

    post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: "POST", body }),

    patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: "PATCH", body }),

    put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: "PUT", body }),

    delete: <T>(endpoint: string, config?: RequestConfig) =>
        apiClient<T>(endpoint, { ...config, method: "DELETE" }),
};

/**
 * Client-side API client (for use in Client Components with React Query)
 * Uses fetch without server-side cookie access
 */
export async function apiClientBrowser<T>(
    endpoint: string,
    config: RequestConfig = {}
): Promise<T> {
    const { body, token, ...fetchOptions } = config;

    if (!token) {
        throw new Error("Token is required for browser API calls");
    }

    const headers = {
        ...buildHeaders(token),
        ...fetchOptions.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.message || errorData.error || `HTTP ${response.status}`
        );
    }

    // Handle empty responses
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}
