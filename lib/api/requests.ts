"use server";

import { User } from "@/types/user-types";
import { api, shouldMock } from "./client";
import type { PaginatedResponse } from "./types";
import type { RequestFormValues } from "@/lib/validations/requests";
import { revalidatePath } from "next/cache";

// ============================================================================
// Types
// ============================================================================

export type RequestStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed" | "cancelled";
export type RequestPriority = "low" | "medium" | "high" | "critical";

export interface RequestItem {
    id: string;
    type: string;
    category: string; // "Toiletries", "Repairs", "Gadget", "Access", "Other"
    requester_id: string;
    requester_name: string;
    requester_role: User["role"] | string;
    request_date: string;
    status: RequestStatus;
    reason: string;
    details: string;
    priority: RequestPriority;
}

export interface RequestFilters {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    search?: string;
    requester_id?: string;
}

export interface RequestStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
}

export interface UpdateRequestPayload {
    category?: string;
    priority?: RequestPriority;
    reason?: string;
    details?: string;
    status?: RequestStatus;
}



// ============================================================================
// Mock Data Loader
// ============================================================================

const getMockRequests = async (): Promise<RequestItem[]> => {
    if (typeof window === "undefined") {
        // Server-side
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/requests.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock requests:", error);
            return [];
        }
    } else {
        // Client-side - use local storage or return empty for now
        // For development, we can try to fetch from an API route that serves the mock,
        // or just return a hardcoded list if the file read isn't possible.
        // For now, let's return an empty list or some dummy data if we can't read the file.
        return [
            {
                id: "req-1",
                type: "General",
                category: "Toiletries",
                requester_id: "user-1",
                requester_name: "John Doe",
                requester_role: "staff",
                request_date: new Date().toISOString(),
                status: "pending",
                reason: "Need soap",
                details: "Restroom soap dispenser is empty",
                priority: "medium"
            }
        ];
    }
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated requests
 */
export async function getRequests(
    filters: RequestFilters = {}
): Promise<PaginatedResponse<RequestItem>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    if (filters.requester_id) params.append("requester_id", filters.requester_id);

    const result = await api.get<{ data: RequestItem[]; pagination: PaginatedResponse<RequestItem>["pagination"] }>(`/api/requests?${params.toString()}`);
    if (!result.success) return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
    return { items: result.data.data, pagination: result.data.pagination };
}



/**
 * Get request statistics
 */
export async function getRequestStats(requesterId?: string): Promise<RequestStats> {
    const endpoint = requesterId
        ? `/api/requests/stats?requester_id=${requesterId}`
        : "/api/requests/stats";

    const result = await api.get<RequestStats>(endpoint);
    if (!result.success) return { total: 0, pending: 0, in_progress: 0, completed: 0 };
    return result.data;
}



/**
 * Create a new request
 */
export async function createRequest(data: RequestFormValues): Promise<RequestItem> {
    const result = await api.post<{ request: RequestItem }>("/api/requests", data);
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/my/requests");
    revalidatePath("/admin/requests");
    return result.data.request;
}



/**
 * Update a request
 */
export async function updateRequest(id: string, data: UpdateRequestPayload): Promise<RequestItem> {
    const result = await api.patch<{ request: RequestItem }>(`/api/requests/${id}`, data);
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/my/requests");
    revalidatePath("/admin/requests");
    return result.data.request;
}



/**
 * Delete a request
 */
export async function deleteRequest(id: string): Promise<void> {
    const result = await api.delete<{ message: string }>(`/api/requests/${id}`);
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/my/requests");
    revalidatePath("/admin/requests");
}


