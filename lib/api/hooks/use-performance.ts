"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getReviews,
    getPerformanceStats,
    type PerformanceFilters,
} from "../performance";

// ============================================================================
// Query Hooks
// ============================================================================

export function usePerformanceReviews(filters: PerformanceFilters = {}) {
    return useQuery({
        queryKey: queryKeys.performance.list(filters),
        queryFn: () => getReviews(filters),
    });
}

export function usePerformanceStats() {
    return useQuery({
        queryKey: queryKeys.performance.stats(),
        queryFn: () => getPerformanceStats(),
    });
}
