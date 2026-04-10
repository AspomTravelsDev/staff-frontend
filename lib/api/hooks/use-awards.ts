"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getAwardTypes,
    getMyAwards,
    getUserAwards,
    assignAward,
    updateAward,
    deleteAward,
    getAllAwards,
    type AssignAwardRequest,
    type UpdateAwardRequest,
} from "../awards";

// ============================================================================
// Query Hooks
// ============================================================================

export function useAwardTypes() {
    return useQuery({
        queryKey: ["award-types"],
        queryFn: () => getAwardTypes(),
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}

export function useMyAwards() {
    return useQuery({
        queryKey: ["my-awards"],
        queryFn: () => getMyAwards(),
    });
}

export function useUserAwards(userId: string) {
    return useQuery({
        queryKey: ["user-awards", userId],
        queryFn: () => getUserAwards(userId),
        enabled: !!userId,
    });
}

export function useAllAwards() {
    return useQuery({
        queryKey: ["all-awards"],
        queryFn: () => getAllAwards(),
    });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

export function useCreateAward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: AssignAwardRequest) => assignAward(data),
        onSuccess: (_, variables) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["all-awards"] });
            queryClient.invalidateQueries({ queryKey: ["user-awards", variables.user_id] });
            queryClient.invalidateQueries({ queryKey: ["my-awards"] }); // In case awarding self?
        },
    });
}

export function useUpdateAward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ awardId, data }: { awardId: string; data: UpdateAwardRequest }) =>
            updateAward(awardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-awards"] });
            queryClient.invalidateQueries({ queryKey: ["my-awards"] });
            queryClient.invalidateQueries({ queryKey: ["user-awards"] });
        },
    });
}

export function useDeleteAward() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (awardId: string) => deleteAward(awardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["all-awards"] });
            queryClient.invalidateQueries({ queryKey: ["my-awards"] });
            queryClient.invalidateQueries({ queryKey: ["user-awards"] });
        },
    });
}
