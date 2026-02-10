"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getEmployees,
    getEmployeeStats,
    type EmployeeFilters,
} from "../employees";

// ============================================================================
// Query Hooks
// ============================================================================

export function useEmployees(filters: EmployeeFilters = {}) {
    return useQuery({
        queryKey: queryKeys.employees.list(filters),
        queryFn: () => getEmployees(filters),
    });
}

export function useEmployeeStats() {
    return useQuery({
        queryKey: queryKeys.employees.stats(),
        queryFn: () => getEmployeeStats(),
    });
}
