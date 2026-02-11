"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getAppraisalHistory,
    getAppraisalById,
    getAppraisalStats,
    submitSelfAppraisal,
    submitSupervisorAppraisal,
    submitMPAppraisal,
    type PerformanceAppraisal,
    type KRAScores,
} from "@/lib/api/performance-appraisal";

// ============================================================================
// Query Hooks
// ============================================================================

export function useAppraisalHistory() {
    return useQuery({
        queryKey: queryKeys.performance.appraisals.list(),
        queryFn: () => getAppraisalHistory(),
    });
}

export function useAppraisalById(id: string) {
    return useQuery({
        queryKey: queryKeys.performance.appraisals.detail(id),
        queryFn: () => getAppraisalById(id),
        enabled: !!id,
    });
}

export function useAppraisalStats() {
    return useQuery({
        queryKey: queryKeys.performance.stats(),
        queryFn: () => getAppraisalStats(),
    });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useSubmitSelfAppraisal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<PerformanceAppraisal>) => submitSelfAppraisal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.performance.appraisals.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.performance.stats() });
        },
    });
}

export function useSubmitSupervisorAppraisal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, scores }: { id: string; scores: KRAScores }) =>
            submitSupervisorAppraisal(id, { supervisor_scores: scores }),
        onSuccess: (updatedAppraisal) => {
            // Update the detail cache
            queryClient.setQueryData(
                queryKeys.performance.appraisals.detail(updatedAppraisal.id),
                updatedAppraisal
            );
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.performance.appraisals.lists() });
        },
    });
}

export function useSubmitMPAppraisal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, scores, rating }: { id: string; scores: KRAScores; rating: number }) =>
            submitMPAppraisal(id, { mp_scores: scores, overall_rating: rating }),
        onSuccess: (updatedAppraisal) => {
            // Update the detail cache
            queryClient.setQueryData(
                queryKeys.performance.appraisals.detail(updatedAppraisal.id),
                updatedAppraisal
            );
            // Invalidate lists and stats
            queryClient.invalidateQueries({ queryKey: queryKeys.performance.appraisals.lists() });
            queryClient.invalidateQueries({ queryKey: queryKeys.performance.stats() });
        },
    });
}
