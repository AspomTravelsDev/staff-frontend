import { User } from "../auth/api";
import { api, USE_REAL_API } from "./client";
import type { PaginatedResponse } from "./types";

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
        // Client-side (should ideally use API route, but for direct import in mock mode)
        // In a real app, client never reads JSON directly, but for this mock setup we might need a workaround 
        // or just rely on server components fetching this.
        return [];
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
    if (USE_REAL_API) {
        const requests = await getMockRequests();
        let filtered = [...requests];

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

    // Real API implementation would wait here
    return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
}

/**
 * Get request statistics
 */
export async function getRequestStats(): Promise<RequestStats> {
    if (USE_REAL_API) {
        const requests = await getMockRequests();

        return {
            total: requests.length,
            pending: requests.filter((r) => r.status === "pending").length,
            in_progress: requests.filter((r) => r.status === "in_progress").length,
            completed: requests.filter((r) => r.status === "completed").length,
        };
    }

    return { total: 0, pending: 0, in_progress: 0, completed: 0 };
}
