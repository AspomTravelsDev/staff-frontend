"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getEmployees,
    getEmployeeStats,
    updateUserStatus,
    updateUser,
    getCurrentUser,
    type EmployeeFilters,
    type UpdateUserRequest,
} from "../employees";

// ============================================================================
// Query Hooks
// ============================================================================

export function useCurrentUser() {
    return useQuery({
        queryKey: queryKeys.users.me(),
        queryFn: () => getCurrentUser(),
    });
}

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

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
            updateUserStatus(userId, isActive),
        onSuccess: () => {
            // Invalidate all employee list queries (regardless of filters)
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) =>
            updateUser(userId, data),
        onSuccess: () => {
            // Invalidate all employee list queries and stats
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
        },
    });
}
