"use server";

import { api, type ApiResponse } from "./client";
import { DocumentFile, UploadDocumentResponse, DocumentFilters, DocumentCategoriesResponse, DocumentFolder, NestedDocumentsResponse } from "@/types/file-types";

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
            } catch {
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
    if (filters.visibility_scope) params.append("visibility_scope", filters.visibility_scope);

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

        // PATCH + multipart/form-data is unreliable across some PHP/proxy setups.
        // Convert metadata updates to JSON for consistent server parsing in production.
        const payload: Record<string, string> = {};
        formData.forEach((value, key) => {
            if (typeof value === "string") {
                payload[key] = value;
            }
        });

        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/documents/${id}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Update failed [${response.status}]:`, errorText);

            let errorMessage = "Update failed";
            try {
                const jsonError = JSON.parse(errorText);
                errorMessage = jsonError.message || jsonError.error || errorMessage;
            } catch {
                if (response.status === 401) errorMessage = "Unauthorized";
                else if (response.status === 403) errorMessage = "Forbidden";
                else errorMessage = `Update failed (${response.status}): ${errorText.substring(0, 100)}`;
            }

            return { success: false, error: { error: errorMessage, code: String(response.status) } };
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
            { value: "checklist", label: "Checklist" },
            { value: "sop", label: "SOP" },
            { value: "job_description", label: "Job Description" },
            { value: "guide", label: "Guide" },
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

/**
 * Get folders and documents nested in a folder
 * GET /api/documents?folder_id=...
 */
export async function getNestedDocuments(filters: DocumentFilters = {}): Promise<ApiResponse<NestedDocumentsResponse>> {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.department) params.append("department", filters.department);
    if (filters.search) params.append("search", filters.search);
    if (filters.tags) params.append("tags", filters.tags);
    if (filters.visibility_scope) params.append("visibility_scope", filters.visibility_scope);
    
    // Default folder_id to 'root' to trigger nested mode
    params.append("folder_id", filters.folder_id || "root");

    const result = await api.get<NestedDocumentsResponse>(`/api/documents?${params.toString()}`);
    return result;
}

/**
 * Create a folder
 * POST /api/folders
 */
export async function createFolder(payload: {
    name: string;
    parent_id?: string | null;
    type: string;
    department: string;
}): Promise<ApiResponse<DocumentFolder>> {
    return api.post<DocumentFolder>("/api/folders", payload);
}

/**
 * Update folder name or parent
 * PATCH /api/folders/{id}
 */
export async function updateFolder(
    id: string,
    payload: { name?: string; parent_id?: string | null }
): Promise<ApiResponse<DocumentFolder>> {
    return api.patch<DocumentFolder>(`/api/folders/${id}`, payload);
}

/**
 * Delete folder recursively
 * DELETE /api/folders/{id}
 */
export async function deleteFolder(id: string): Promise<ApiResponse<void>> {
    const result = await api.delete<{ message: string }>(`/api/folders/${id}`);
    if (!result.success) return result;
    return { success: true, data: undefined };
}

/**
 * Get all folders under type/department constraints
 * GET /api/folders?type=...&department=...
 */
export async function getAllFolders(filters: DocumentFilters = {}): Promise<ApiResponse<DocumentFolder[]>> {
    const params = new URLSearchParams();
    if (filters.type) params.append("type", filters.type);
    if (filters.category) params.append("category", filters.category);
    if (filters.department) params.append("department", filters.department);
    if (filters.visibility_scope) params.append("visibility_scope", filters.visibility_scope);

    return api.get<DocumentFolder[]>(`/api/folders?${params.toString()}`);
}
