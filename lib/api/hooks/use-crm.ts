"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getClients,
    getCRMStats,
    type CRMFilters,
} from "../crm";

// ============================================================================
// Query Hooks
// ============================================================================

export function useCRMClients(filters: CRMFilters = {}) {
    return useQuery({
        queryKey: queryKeys.crm.clients.list(filters),
        queryFn: () => getClients(filters),
    });
}

export function useCRMStats() {
    return useQuery({
        queryKey: queryKeys.crm.stats(),
        queryFn: () => getCRMStats(),
    });
}
