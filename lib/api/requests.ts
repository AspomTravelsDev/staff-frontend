"use server";

import { User } from "@/types/user-types";
import { api, shouldMock } from "./client";
import type { PaginatedResponse } from "./types";
import type { RequestFormValues } from "@/lib/validations/requests";

// ============================================================================
// Types
// ============================================================================

export type RequestStatus = "pending" | "approved" | "rejected" | "in_progress" | "completed";
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
    if (shouldMock("useMockRequests")) {
        const requests = await getMockRequests();
        let filtered = [...requests];

        if (filters.requester_id) {
            filtered = filtered.filter((r) => r.requester_id === filters.requester_id);
        }
        if (filters.status) {
            filtered = filtered.filter((r) => r.status === filters.status);
        }
        if (filters.category) {
            filtered = filtered.filter((r) => r.category === filters.category);
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (r) =>
                    r.requester_name.toLowerCase().includes(search) ||
                    r.reason.toLowerCase().includes(search) ||
                    r.category.toLowerCase().includes(search)
            );
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by date desc
        filtered.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());

        return {
            items: filtered.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    if (filters.requester_id) params.append("requester_id", filters.requester_id);

    const result = await api.get<PaginatedResponse<RequestItem>>(`/api/requests?${params.toString()}`);
    if (!result.success) return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
    return result.data;
}

/**
 * Get request statistics
 */
export async function getRequestStats(requesterId?: string): Promise<RequestStats> {
    if (shouldMock("useMockRequests")) {
        const requests = await getMockRequests();
        const filtered = requesterId
            ? requests.filter(r => r.requester_id === requesterId)
            : requests;

        return {
            total: filtered.length,
            pending: filtered.filter((r) => r.status === "pending").length,
            in_progress: filtered.filter((r) => r.status === "in_progress").length,
            completed: filtered.filter((r) => r.status === "completed" || r.status === "approved" || r.status === "rejected").length,
        };
    }

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
    if (shouldMock("useMockRequests")) {
        // Mock creation
        return {
            id: `req-${Date.now()}`,
            type: "General",
            category: data.category,
            requester_id: "current-user", // Should be replaced with actual user ID in real app
            requester_name: "Current User",
            requester_role: "staff",
            request_date: new Date().toISOString(),
            status: "pending",
            reason: data.reason,
            details: data.details,
            priority: data.priority,
        };
    }

    const result = await api.post<{ request: RequestItem }>("/api/requests", data);
    if (!result.success) throw new Error(result.error.error);
    return result.data.request;
}

/**
 * Update a request
 */
export async function updateRequest(id: string, data: Partial<RequestFormValues>): Promise<RequestItem> {
    if (shouldMock("useMockRequests")) {
        // Mock update
        return {
            id,
            type: "General",
            category: data.category || "General",
            requester_id: "current-user",
            requester_name: "Current User",
            requester_role: "staff",
            request_date: new Date().toISOString(),
            status: "pending",
            reason: data.reason || "",
            details: data.details || "",
            priority: data.priority || "low",
        };
    }

    const result = await api.patch<{ request: RequestItem }>(`/api/requests/${id}`, data);
    if (!result.success) throw new Error(result.error.error);
    return result.data.request;
}

/**
 * Delete a request
 */
export async function deleteRequest(id: string): Promise<void> {
    if (shouldMock("useMockRequests")) {
        return;
    }

    const result = await api.delete<{ message: string }>(`/api/requests/${id}`);
    if (!result.success) throw new Error(result.error.error);
}
