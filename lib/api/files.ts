"use server";

import { api, type ApiResponse } from "./client";
import { DocumentFile, UploadDocumentResponse, DocumentFilters } from "@/types/file-types";

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
 * Upload a document (HR/Super only)
 * POST /api/documents
 */
export async function uploadDocument(formData: FormData): Promise<ApiResponse<DocumentFile>> {
    try {
        const token = await import("@/lib/auth/session").then(m => m.getAuthToken());

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
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
            } catch (e) {
                if (response.status === 413) errorMessage = "File too large (server limit)";
                else if (response.status === 401) errorMessage = "Unauthorized";
                else if (response.status === 403) errorMessage = "Forbidden (HR/Super only)";
                else errorMessage = `Upload failed (${response.status}): ${errorText.substring(0, 100)}`;
            }

            return { success: false, error: { error: errorMessage, code: String(response.status) } };
        }

        const result: UploadDocumentResponse = await response.json();
        return { success: true, data: result.document };

    } catch (error: any) {
        console.error("Upload exception:", error);
        return { success: false, error: { error: error.message || "Network error", code: "500" } };
    }
}

/**
 * Get all documents
 * GET /api/documents
 */
export async function getAllDocuments(filters: DocumentFilters = {}): Promise<ApiResponse<DocumentFile[]>> {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);

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
 * Get category options (if needed, or just hardcode for now)
 * GET /api/documents/categories
 */
export async function getDocumentCategories(): Promise<string[]> {
    const result = await api.get<DataWrapper<string[]>>("/api/documents/categories");
    if (!result.success) return ["handbook", "policies", "contracts"]; // Fallback
    return result.data.data;
}

/**
 * Get auth token for file download (Client Component helper)
 */
export async function getFileDownloadToken(): Promise<string | null> {
    const { getAuthToken } = await import("@/lib/auth/session");
    return getAuthToken();
}
