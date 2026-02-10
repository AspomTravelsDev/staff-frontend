"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getLeaveRequests,
    getLeaveStats,
    type LeaveFilters,
} from "../leave";

// ============================================================================
// Query Hooks
// ============================================================================

export function useLeaveRequests(filters: LeaveFilters = {}) {
    return useQuery({
        queryKey: queryKeys.leave.list(filters),
        queryFn: () => getLeaveRequests(filters),
    });
}

export function useLeaveStats() {
    return useQuery({
        queryKey: queryKeys.leave.stats(),
        queryFn: () => getLeaveStats(),
    });
}
