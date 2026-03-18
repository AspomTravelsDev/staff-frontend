"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    closeWeeklyFeedbackForm,
    createWeeklyFeedbackQuestion,
    deleteWeeklyFeedbackQuestion,
    getWeeklyFeedbackAnalytics,
    getWeeklyFeedbackActive,
    getWeeklyFeedbackLockStatus,
    getWeeklyFeedbackQuestions,
    publishWeeklyFeedbackForm,
    saveWeeklyFeedbackResponse,
    saveWeeklyFeedbackDraft,
    updateWeeklyFeedbackQuestion,
} from "@/lib/api/weekly-feedback";
import { weeklyFeedbackQueryKeys } from "./weekly-feedback-query-keys";
import type { WeeklyFeedbackActivePayload } from "@/types/weekly-feedback-types";

export function useWeeklyFeedbackActive(options?: {
    initialData?: WeeklyFeedbackActivePayload | null;
}) {
    return useQuery({
        queryKey: weeklyFeedbackQueryKeys.active(),
        queryFn: async () => {
            const result = await getWeeklyFeedbackActive();
            if (!result.success) throw new Error(result.error.error);
            return result.data;
        },
        initialData: options?.initialData,
    });
}

export function useWeeklyFeedbackLockStatus() {
    return useQuery({
        queryKey: weeklyFeedbackQueryKeys.lockStatus(),
        queryFn: async () => {
            const result = await getWeeklyFeedbackLockStatus();
            if (!result.success) throw new Error(result.error.error);
            return result.data;
        },
    });
}

export function useSaveWeeklyFeedbackResponse() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: saveWeeklyFeedbackResponse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.all });
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}

export function useWeeklyFeedbackQuestions() {
    return useQuery({
        queryKey: weeklyFeedbackQueryKeys.questions(),
        queryFn: async () => {
            const result = await getWeeklyFeedbackQuestions();
            if (!result.success) throw new Error(result.error.error);
            return result.data;
        },
    });
}

export function useWeeklyFeedbackAnalytics(weekStart?: string) {
    return useQuery({
        queryKey: weeklyFeedbackQueryKeys.analytics(weekStart),
        queryFn: async () => {
            const result = await getWeeklyFeedbackAnalytics(weekStart);
            if (!result.success) throw new Error(result.error.error);
            return result.data;
        },
    });
}

export function useCreateWeeklyFeedbackQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createWeeklyFeedbackQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.questions() });
        },
    });
}

export function useDeleteWeeklyFeedbackQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteWeeklyFeedbackQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.questions() });
        },
    });
}

export function useUpdateWeeklyFeedbackQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            payload,
        }: {
            id: string;
            payload: {
                question?: string;
                type?: "single_choice" | "multi_choice" | "rating";
                options?: string[];
                is_default?: boolean;
                is_active?: boolean;
            };
        }) => updateWeeklyFeedbackQuestion(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.questions() });
        },
    });
}

export function useSaveWeeklyFeedbackDraft() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: saveWeeklyFeedbackDraft,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.all });
        },
    });
}

export function usePublishWeeklyFeedbackForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: publishWeeklyFeedbackForm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.all });
        },
    });
}

export function useCloseWeeklyFeedbackForm() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: closeWeeklyFeedbackForm,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: weeklyFeedbackQueryKeys.all });
        },
    });
}
