"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getClients,
    getCRMStats,
} from "../crm";
import type { CRMFilters } from "../crm-constants";

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
