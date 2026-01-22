"use client";

/**
 * React Query Hooks for Activity/Audit Log
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import {
    getActivities,
    getUnreadActivityCount,
    markActivityRead,
    markAllActivitiesRead,
    type ActivityFilters,
} from "../activity";

/**
 * Fetch paginated activity list
 */
export function useActivities(filters: ActivityFilters = {}) {
    return useQuery({
        queryKey: queryKeys.activity.list(filters),
        queryFn: () => getActivities(filters),
    });
}

/**
 * Fetch unread activity count (for badges)
 */
export function useUnreadActivityCount() {
    return useQuery({
        queryKey: queryKeys.activity.unreadCount(),
        queryFn: () => getUnreadActivityCount(),
        refetchInterval: 60 * 1000, // Poll every minute
    });
}

/**
 * Mark single activity as read
 */
export function useMarkActivityRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => markActivityRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
        },
    });
}

/**
 * Mark all activities as read
 */
export function useMarkAllActivitiesRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => markAllActivitiesRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.activity.all });
        },
    });
}
