"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getRequests,
    getRequestStats,
    type RequestFilters,
} from "../requests";

// ============================================================================
// Query Hooks
// ============================================================================

export function useRequests(filters: RequestFilters = {}) {
    return useQuery({
        queryKey: queryKeys.requests.list(filters),
        queryFn: () => getRequests(filters),
    });
}

export function useRequestStats() {
    return useQuery({
        queryKey: queryKeys.requests.stats(),
        queryFn: () => getRequestStats(),
    });
}
