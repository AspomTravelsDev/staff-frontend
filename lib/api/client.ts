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

        let text = "";
        let data: any = null;
        try {
            text = await response.text();
            if (text && text.trim()) {
                data = JSON.parse(text);
            }
        } catch {
            // Response was not JSON (e.g. 502/504 HTML from Nginx/Vercel or PHP fatal error)
            data = null;
        }

        if (!response.ok) {
            const isRecruitmentUpload =
                fetchOptions.method === "POST" &&
                /^\/api\/recruitment\/roles\/[^/]+\/candidates$/.test(endpoint);
            const isUpstreamUploadBlock = isRecruitmentUpload && response.status === 403 && data === null;
            const responseErrorCode = isUpstreamUploadBlock
                ? "UPLOAD_BLOCKED_BY_HOSTING"
                : data?.code || `HTTP_${response.status}`;

            if (isRecruitmentUpload) {
                // Distinguish Laravel authorization from an upstream HTML rejection.
                // Never log the token, CV, candidate details, or response body.
                console.error("[Recruitment CV upstream rejection]", {
                    endpoint,
                    status: response.status,
                    code: responseErrorCode,
                    contentType: response.headers.get("content-type"),
                    server: response.headers.get("server"),
                    hcdnRequestId: response.headers.get("x-hcdn-request-id"),
                    hasAuthToken: Boolean(token),
                });
            }

            // Handle 401 Unauthorized globally (only for true session expiration)
            if (response.status === 401 && data?.code === "UNAUTHENTICATED" && !endpoint.includes("/login")) {
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

            let errorMessage = isUpstreamUploadBlock
                ? "The hosting server blocked the CV upload. Please contact IT support."
                : data?.message || data?.error;
            if (data?.details && typeof data.details === "string" && data.details.trim() && data.details !== errorMessage) {
                errorMessage = `${errorMessage} (${data.details.trim()})`;
            }
            if (data?.errors && typeof data.errors === "object") {
                const flatErrors = Object.values(data.errors).flat().filter(Boolean);
                if (flatErrors.length > 0) {
                    errorMessage = flatErrors.join(" ");
                }
            }

            // Meaningful fallbacks when backend doesn't return JSON or a message
            if (!errorMessage) {
                if (response.status === 502 || response.status === 503) {
                    errorMessage = "Server is temporarily unavailable. Please try again in a moment.";
                } else if (response.status === 504) {
                    errorMessage = "The server request timed out. Please try again.";
                } else if (response.status === 500) {
                    errorMessage = "Internal server error. Please try again or contact IT support.";
                } else if (response.status === 413) {
                    errorMessage = "The uploaded file or request is too large for the server.";
                } else if (response.status === 403) {
                    errorMessage = "You do not have permission to perform this action.";
                } else if (response.status === 404) {
                    errorMessage = "The requested resource was not found.";
                } else {
                    errorMessage = `Request failed with status ${response.status}`;
                }
            }

            return {
                success: false,
                error: {
                    error: errorMessage,
                    code: responseErrorCode,
                },
            };
        }

        return { success: true, data: (data ?? ({} as T)) };
    } catch (error: any) {
        console.error(`API Error [${endpoint}]:`, error);
        const isAbort = error?.name === "AbortError";
        const message = isAbort
            ? "Request was cancelled."
            : (error?.message && !error.message.includes("fetch failed") && !error.message.includes("NetworkError")
                ? error.message
                : "Unable to reach the server. Please check your internet connection.");
        return {
            success: false,
            error: {
                error: message,
                code: isAbort ? "ABORTED" : "NETWORK_ERROR",
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
        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch {
            errorData = {};
        }

        let errorMessage = errorData.message || errorData.error;
        if (errorData.errors && typeof errorData.errors === "object") {
            const flat = Object.values(errorData.errors).flat().filter(Boolean);
            if (flat.length > 0) errorMessage = flat.join(" ");
        }

        if (!errorMessage) {
            if (response.status === 502 || response.status === 503) {
                errorMessage = "Server is temporarily unavailable. Please try again in a moment.";
            } else if (response.status === 504) {
                errorMessage = "The server request timed out. Please try again.";
            } else if (response.status === 500) {
                errorMessage = "Internal server error. Please try again or contact IT support.";
            } else {
                errorMessage = `Request failed with status ${response.status}`;
            }
        }

        throw new Error(errorMessage);
    }

    // Handle empty responses
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

