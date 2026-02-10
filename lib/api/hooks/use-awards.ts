"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getAwards,
    getAwardStats,
    createAward,
    type AwardFilters,
    type CreateAwardRequest
} from "../awards";

// ============================================================================
// Query Hooks
// ============================================================================

export function useAwards(filters: AwardFilters = {}) {
    return useQuery({
        queryKey: queryKeys.awards.list(filters),
        queryFn: () => getAwards(filters),
    });
}

export function useAwardStats() {
    return useQuery({
        queryKey: queryKeys.awards.stats(),
        queryFn: () => getAwardStats(),
    });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateAward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateAwardRequest) => createAward(data),
        onSuccess: () => {
            // Invalidate lists and stats
            queryClient.invalidateQueries({ queryKey: queryKeys.awards.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.awards.stats() });
        },
    });
}
