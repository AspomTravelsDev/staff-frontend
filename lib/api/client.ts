/**
 * Centralized API Client
 *
 * Provides a typed fetch wrapper with automatic authentication,
 * error handling, and mock mode support for development.
 */


export { API_CONFIG, shouldMock } from "./config";

const defaultApiUrl = process.env.NODE_ENV === "production"
    ? "https://api.aspomportal.com"
    : "http://localhost:8000";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;

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
function buildHeaders(token?: string | null, isFormData?: boolean): HeadersInit {
    const headers: Record<string, string> = {
        Accept: "application/json",
    };

    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }

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
    const isFormData = body instanceof FormData;

    // Get auth token if not skipped
    let token: string | null = null;
    if (!skipAuth) {
        // Dynamically import to allow this file to be imported in client components without breaking
        const { getAuthToken } = await import("@/lib/auth/session");
        token = customToken ?? (await getAuthToken());
    }

    const headers = {
        ...buildHeaders(token, isFormData),
        ...fetchOptions.headers,
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
            cache: fetchOptions.cache ?? "no-store",
        });

        // Handle empty responses (204 No Content)
        if (response.status === 204) {
            return { success: true, data: null as T };
        }

        let data;
        try {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error(`API JSON Parse Error [${endpoint}]:`, e);
                console.error("Raw Response Preview:", text.substring(0, 1000));
                console.error("Raw Response End:", text.slice(-1000));
                throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}...`);
            }
        } catch (error) {
            // Handle non-json responses or network stream errors
            throw error;
        }

        if (!response.ok) {
            // Handle 401 Unauthorized globally (only for true session expiration)
            if (response.status === 401 && data?.code === "UNAUTHENTICATED" && !endpoint.includes("/login")) {
                // If in browser context, trigger global redirection
                if (typeof window !== "undefined") {
                    const { toast } = await import("sonner");
                    toast.error("Session expired. Please login again.");
                    setTimeout(() => {
                        window.location.href = "/auth/logout";
                    }, 1500);
                }

                return {
                    success: false,
                    error: {
                        error: "Your session has expired. Please login again.",
                        code: "UNAUTHENTICATED",
                    },
                };
            }

            let errorMessage = data?.message || data?.error;
            if (data?.details && typeof data.details === "string" && data.details.trim() && data.details !== errorMessage) {
                errorMessage = `${errorMessage} (${data.details.trim()})`;
            }
            if (data?.errors && typeof data.errors === "object") {
                const flatErrors = Object.values(data.errors).flat().filter(Boolean);
                if (flatErrors.length > 0) {
                    errorMessage = flatErrors.join(" ");
                }
            }
            if (!errorMessage) {
                errorMessage = `Request failed with status ${response.status}`;
            }

            return {
                success: false,
                error: {
                    error: errorMessage,
                    code: data?.code || `HTTP_${response.status}`,
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
    const isFormData = body instanceof FormData;

    if (!token) {
        throw new Error("Token is required for browser API calls");
    }

    const headers = {
        ...buildHeaders(token, isFormData),
        ...fetchOptions.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: isFormData ? (body as any) : (body ? JSON.stringify(body) : undefined),
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
