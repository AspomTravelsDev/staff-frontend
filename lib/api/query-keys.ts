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

    /**
     * CRM keys
     */
    crm: {
        all: ["crm"] as const,
        clients: {
            all: ["crm", "clients"] as const,
            lists: () => [...queryKeys.crm.clients.all, "list"] as const,
            list: (filters?: QueryFilters) => [...queryKeys.crm.clients.lists(), filters] as const,
        },
        stats: () => ["crm", "stats"] as const,
    },

    /**
     * Employee keys
     */
    employees: {
        all: ["employees"] as const,
        lists: () => [...queryKeys.employees.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.employees.lists(), filters] as const,
        stats: () => ["employees", "stats"] as const,
    },

    /**
     * Request keys
     */
    requests: {
        all: ["requests"] as const,
        lists: () => [...queryKeys.requests.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.requests.lists(), filters] as const,
        stats: () => ["requests", "stats"] as const,
    },

    /**
     * Leave keys
     */
    leave: {
        all: ["leave"] as const,
        lists: () => [...queryKeys.leave.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.leave.lists(), filters] as const,
        stats: () => ["leave", "stats"] as const,
    },

    /**
     * Inventory keys
     */
    inventory: {
        all: ["inventory"] as const,
        lists: () => [...queryKeys.inventory.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.inventory.lists(), filters] as const,
        stats: () => ["inventory", "stats"] as const,
    },

    /**
     * Performance keys
     */
    performance: {
        all: ["performance"] as const,
        appraisals: {
            all: () => [...queryKeys.performance.all, "appraisals"] as const,
            lists: () => [...queryKeys.performance.appraisals.all(), "list"] as const,
            list: (filters?: QueryFilters) => [...queryKeys.performance.appraisals.lists(), filters] as const,
            details: () => [...queryKeys.performance.appraisals.all(), "detail"] as const,
            detail: (id: string) => [...queryKeys.performance.appraisals.details(), id] as const,
        },
        stats: () => [...queryKeys.performance.all, "stats"] as const,
    },

    /**
     * Compliance keys
     */
    compliance: {
        all: ["compliance"] as const,
        lists: () => [...queryKeys.compliance.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.compliance.lists(), filters] as const,
        stats: () => ["compliance", "stats"] as const,
    },
    awards: {
        all: ["awards"] as const,
        lists: () => [...queryKeys.awards.all, "list"] as const,
        list: (filters?: QueryFilters) => [...queryKeys.awards.lists(), filters] as const,
        stats: () => ["awards", "stats"] as const,
    },
} as const;

/**
 * Helper to invalidate all queries for a module
 */
export function getInvalidationKeys(module: keyof typeof queryKeys) {
    return queryKeys[module];
}
