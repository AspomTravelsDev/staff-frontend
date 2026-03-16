"use server";

import { api, type ApiResponse } from "./client";
import { DocumentFile, UploadDocumentResponse, DocumentFilters, DocumentCategoriesResponse } from "@/types/file-types";

// ============================================================================
// Types
// ============================================================================

interface DataWrapper<T> {
    data: T;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Upload a document
 * POST /api/documents
 */
export async function uploadDocument(formData: FormData): Promise<ApiResponse<DocumentFile>> {
    try {
        const token = await import("@/lib/auth/session").then(m => m.getAuthToken());

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        // Note: New API endpoint is /api/documents
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents`, {
            method: "POST",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upload failed [${response.status}]:`, errorText);

            let errorMessage = "Upload failed";
            try {
                const jsonError = JSON.parse(errorText);
                errorMessage = jsonError.message || jsonError.error || errorMessage;
            } catch (_) {
                if (response.status === 413) errorMessage = "File too large (server limit)";
                else if (response.status === 401) errorMessage = "Unauthorized";
                else if (response.status === 403) errorMessage = "Forbidden";
                else errorMessage = `Upload failed (${response.status}): ${errorText.substring(0, 100)}`;
            }

            return { success: false, error: { error: errorMessage, code: String(response.status) } };
        }

        const result: UploadDocumentResponse = await response.json();
        return { success: true, data: result.data };

    } catch (error: unknown) {
        console.error("Upload exception:", error);
        const errorMessage = error instanceof Error ? error.message : "Network error";
        return { success: false, error: { error: errorMessage, code: "500" } };
    }
}

/**
 * Get all documents
 * GET /api/documents
 */
export async function getAllDocuments(filters: DocumentFilters = {}): Promise<ApiResponse<DocumentFile[]>> {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.department) params.append("department", filters.department);
    if (filters.search) params.append("search", filters.search);
    if (filters.tags) params.append("tags", filters.tags);

    const result = await api.get<DataWrapper<DocumentFile[]>>(`/api/documents?${params.toString()}`);
    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

/**
 * Delete a document
 * DELETE /api/documents/{id}
 */
export async function deleteDocument(id: string): Promise<ApiResponse<void>> {
    const result = await api.delete<{ message: string }>(`/api/documents/${id}`);
    if (!result.success) return result;
    return { success: true, data: undefined };
}

/**
 * Update a document
 * PATCH /api/documents/{id}
 */
export async function updateDocument(id: string, formData: FormData): Promise<ApiResponse<DocumentFile>> {
    try {
        const token = await import("@/lib/auth/session").then(m => m.getAuthToken());

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${id}`, {
            method: "PATCH",
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Update failed [${response.status}]:`, errorText);
            return { success: false, error: { error: "Update failed", code: String(response.status) } };
        }

        const result: UploadDocumentResponse = await response.json();
        return { success: true, data: result.data };

    } catch (error: unknown) {
        console.error("Update exception:", error);
        const errorMessage = error instanceof Error ? error.message : "Network error";
        return { success: false, error: { error: errorMessage, code: "500" } };
    }
}

/**
 * Get document category and type options
 * GET /api/documents/categories
 */
export async function getDocumentCategories(): Promise<DocumentCategoriesResponse> {
    const fallback: DocumentCategoriesResponse = {
        categories: [
            { value: "handbook", label: "Handbook" },
            { value: "policies", label: "Policies" },
            { value: "contracts", label: "Contracts" },
        ],
        types: [
            { value: "hr", label: "HR/Organization" },
            { value: "onboarding", label: "Onboarding" },
            { value: "visa", label: "Visa Documents" },
            { value: "general", label: "General Documents" },
        ],
    };

    const result = await api.get<DocumentCategoriesResponse>("/api/documents/categories");
    if (!result.success) return fallback;
    return result.data;
}

/**
 * Get auth token for file download (Client Component helper)
 */
export async function getFileDownloadToken(): Promise<string | null> {
    const { getAuthToken } = await import("@/lib/auth/session");
    return getAuthToken();
}
