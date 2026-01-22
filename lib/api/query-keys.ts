/**
 * React Query Key Factory
 *
 * Centralized query key management to ensure consistency
 * across queries and cache invalidation.
 *
 * Pattern: entity -> scope -> filters
 *
 * @example
 * // All visa applications
 * queryKeys.visa.applications.all
 *
 * // Single application
 * queryKeys.visa.applications.detail("app-123")
 *
 * // Filtered list
 * queryKeys.visa.applications.list({ status: "submitted", page: 1 })
 */

// Generic filter type for query keys - intentionally loose to accept any filter object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryFilters = Record<string, any> | undefined;

export const queryKeys = {
    /**
     * Visa module keys
     */
    visa: {
        applications: {
            all: ["visa", "applications"] as const,
            lists: () => [...queryKeys.visa.applications.all, "list"] as const,
            list: (filters?: QueryFilters) =>
                [...queryKeys.visa.applications.lists(), filters] as const,
            details: () => [...queryKeys.visa.applications.all, "detail"] as const,
            detail: (id: string) =>
                [...queryKeys.visa.applications.details(), id] as const,
            notes: (id: string) =>
                [...queryKeys.visa.applications.detail(id), "notes"] as const,
            documents: (id: string) =>
                [...queryKeys.visa.applications.detail(id), "documents"] as const,
            auditLog: (id: string) =>
                [...queryKeys.visa.applications.detail(id), "audit"] as const,
        },
    },

    /**
     * Activity / Audit log keys
     */
    activity: {
        all: ["activity"] as const,
        lists: () => [...queryKeys.activity.all, "list"] as const,
        list: (filters?: { page?: number; entity_type?: string }) =>
            [...queryKeys.activity.lists(), filters] as const,
        unreadCount: () => [...queryKeys.activity.all, "unread-count"] as const,
    },

    /**
     * Users / Staff keys (for assignments, etc.)
     */
    users: {
        all: ["users"] as const,
        lists: () => [...queryKeys.users.all, "list"] as const,
        list: (filters?: { role?: string }) =>
            [...queryKeys.users.lists(), filters] as const,
        detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
        staff: () => [...queryKeys.users.all, "staff"] as const,
    },
} as const;

/**
 * Helper to invalidate all queries for a module
 */
export function getInvalidationKeys(module: keyof typeof queryKeys) {
    return queryKeys[module];
}
