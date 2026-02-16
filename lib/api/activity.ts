/**
 * Activity API Module
 *
 * API functions for system-wide activity/audit log.
 */

import { api, shouldMock } from "./client";
import { getMockActivities } from "./mock-loader";
import type { PaginatedResponse, ActivityItem } from "./types";

// ============================================================================
// Types
// ============================================================================

export interface ActivityFilters {
    page?: number;
    limit?: number;
    entity_type?: string;
    action?: string;
    actor_id?: string;
    date_from?: string;
    date_to?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated activity/audit log
 */
export async function getActivities(
    filters: ActivityFilters = {}
): Promise<PaginatedResponse<ActivityItem>> {
    if (shouldMock("useMockActivity")) {
        const activities = await getMockActivities();
        let filtered = [...activities];

        if (filters.entity_type) {
            filtered = filtered.filter(
                (act) => act.entity_type === filters.entity_type
            );
        }
        if (filters.action) {
            filtered = filtered.filter((act) => act.action === filters.action);
        }
        if (filters.actor_id) {
            filtered = filtered.filter((act) => act.actor_id === filters.actor_id);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

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
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const result = await api.get<PaginatedResponse<ActivityItem>>(
        `/activity?${params.toString()}`
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get unread activity count
 */
export async function getUnreadActivityCount(): Promise<number> {
    if (shouldMock("useMockActivity")) {
        const activities = await getMockActivities();
        return activities.filter((act) => !act.is_read).length;
    }

    const result = await api.get<{ count: number }>("/activity/unread-count");

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data.count;
}

/**
 * Mark activity as read
 */
export async function markActivityRead(id: string): Promise<void> {
    if (shouldMock("useMockActivity")) {
        // In mock mode, we can't persist this change
        console.log(`Mock: Marking activity ${id} as read`);
        return;
    }

    const result = await api.patch(`/activity/${id}/read`);

    if (!result.success) {
        throw new Error(result.error.error);
    }
}

/**
 * Mark all activities as read
 */
export async function markAllActivitiesRead(): Promise<void> {
    if (shouldMock("useMockActivity")) {
        console.log("Mock: Marking all activities as read");
        return;
    }

    const result = await api.post("/activity/mark-all-read");

    if (!result.success) {
        throw new Error(result.error.error);
    }
}
