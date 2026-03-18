"use server";

import { api, type ApiResponse } from "./client";
import type {
    WeeklyFeedbackActivePayload,
    WeeklyFeedbackAnalyticsPayload,
    WeeklyFeedbackForm,
    WeeklyFeedbackQuestionBankItem,
    WeeklyFeedbackLockStatus,
    WeeklyFeedbackResponse,
} from "@/types/weekly-feedback-types";

interface DataWrapper<T> {
    data: T;
}

export async function getWeeklyFeedbackActive(): Promise<
    ApiResponse<WeeklyFeedbackActivePayload | null>
> {
    const result = await api.get<DataWrapper<WeeklyFeedbackActivePayload | null>>(
        "/api/weekly-feedback/active"
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function saveWeeklyFeedbackResponse(payload: {
    form_id: string;
    answers: Record<string, string | string[] | number>;
    is_completed?: boolean;
}): Promise<
    ApiResponse<{
        response: WeeklyFeedbackResponse;
        lock_status: WeeklyFeedbackLockStatus;
    }>
> {
    const result = await api.post<
        DataWrapper<{
            response: WeeklyFeedbackResponse;
            lock_status: WeeklyFeedbackLockStatus;
        }>
    >("/api/weekly-feedback/response", payload);

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function getWeeklyFeedbackLockStatus(): Promise<
    ApiResponse<WeeklyFeedbackLockStatus>
> {
    const result = await api.get<DataWrapper<WeeklyFeedbackLockStatus>>(
        "/api/weekly-feedback/lock-status"
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function getWeeklyFeedbackQuestions(): Promise<
    ApiResponse<WeeklyFeedbackQuestionBankItem[]>
> {
    const result = await api.get<DataWrapper<WeeklyFeedbackQuestionBankItem[]>>(
        "/api/weekly-feedback/questions"
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function createWeeklyFeedbackQuestion(payload: {
    question: string;
    type: "single_choice" | "multi_choice" | "rating";
    options?: string[];
    is_default?: boolean;
    is_active?: boolean;
}): Promise<ApiResponse<WeeklyFeedbackQuestionBankItem>> {
    const result = await api.post<DataWrapper<WeeklyFeedbackQuestionBankItem>>(
        "/api/weekly-feedback/questions",
        payload
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function updateWeeklyFeedbackQuestion(
    id: string,
    payload: {
        question?: string;
        type?: "single_choice" | "multi_choice" | "rating";
        options?: string[];
        is_default?: boolean;
        is_active?: boolean;
    }
): Promise<ApiResponse<WeeklyFeedbackQuestionBankItem>> {
    const result = await api.patch<DataWrapper<WeeklyFeedbackQuestionBankItem>>(
        `/api/weekly-feedback/questions/${id}`,
        payload
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function deleteWeeklyFeedbackQuestion(
    id: string
): Promise<ApiResponse<{ message: string }>> {
    const result = await api.delete<{ message: string }>(
        `/api/weekly-feedback/questions/${id}`
    );

    return result;
}

export async function saveWeeklyFeedbackDraft(payload: {
    week_start: string;
    question_bank_ids?: string[];
    additional_questions?: Array<{
        question: string;
        type: "single_choice" | "multi_choice" | "rating";
        options?: string[];
    }>;
}): Promise<ApiResponse<WeeklyFeedbackForm>> {
    const result = await api.post<DataWrapper<WeeklyFeedbackForm>>(
        "/api/weekly-feedback/forms/draft",
        payload
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function publishWeeklyFeedbackForm(payload: {
    week_start: string;
}): Promise<ApiResponse<WeeklyFeedbackForm>> {
    const result = await api.post<DataWrapper<WeeklyFeedbackForm>>(
        "/api/weekly-feedback/forms/publish",
        payload
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function closeWeeklyFeedbackForm(payload: {
    week_start: string;
}): Promise<ApiResponse<WeeklyFeedbackForm>> {
    const result = await api.post<DataWrapper<WeeklyFeedbackForm>>(
        "/api/weekly-feedback/forms/close",
        payload
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function getWeeklyFeedbackAnalytics(weekStart?: string): Promise<
    ApiResponse<WeeklyFeedbackAnalyticsPayload>
> {
    const suffix = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : "";
    const result = await api.get<DataWrapper<WeeklyFeedbackAnalyticsPayload>>(
        `/api/weekly-feedback/analytics${suffix}`
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}
