"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getComplianceIssues,
    getComplianceStats,
    type ComplianceFilters,
} from "../compliance";

// ============================================================================
// Query Hooks
// ============================================================================

export function useComplianceIssues(filters: ComplianceFilters = {}) {
    return useQuery({
        queryKey: queryKeys.compliance.list(filters),
        queryFn: () => getComplianceIssues(filters),
    });
}

export function useComplianceStats() {
    return useQuery({
        queryKey: queryKeys.compliance.stats(),
        queryFn: () => getComplianceStats(),
    });
}
