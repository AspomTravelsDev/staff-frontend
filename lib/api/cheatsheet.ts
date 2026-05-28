"use server";

import { api, type ApiResponse } from "./client";
import type {
    CheatsheetItem,
    CheatsheetQuizPayload,
    CheatsheetQuizSubmitResponse,
    CheatsheetQuizAttempt,
    CheatsheetQuizAttemptDetail,
} from "@/types/cheatsheet-types";

interface DataWrapper<T> {
    data: T;
}

export async function getRandomCheatsheetItems(count = 2): Promise<CheatsheetItem[]> {
    const result = await api.get<DataWrapper<CheatsheetItem[] | CheatsheetItem | null>>(
        `/api/cheatsheet/random?limit=${count}`,
    );

    if (!result.success || !result.data || !result.data.data) return [];
    if (!Array.isArray(result.data.data)) {
        return [result.data.data];
    }
    return result.data.data;
}

export async function markCheatsheetItemViewed(
    itemId: string,
): Promise<ApiResponse<{ message: string }>> {
    return api.post<{ message: string }>(`/api/cheatsheet/items/${itemId}/view`);
}

export async function getCheatsheetQuiz(
    count = 10,
): Promise<ApiResponse<CheatsheetQuizPayload>> {
    const result = await api.get<DataWrapper<CheatsheetQuizPayload>>(
        `/api/cheatsheet/quiz?count=${encodeURIComponent(count)}`,
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function submitCheatsheetQuiz(payload: {
    question_ids: string[];
    answers: Record<string, string>;
    is_completed?: boolean;
}): Promise<ApiResponse<CheatsheetQuizSubmitResponse>> {
    const result = await api.post<DataWrapper<CheatsheetQuizSubmitResponse>>(
        "/api/cheatsheet/quiz/submit",
        payload,
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function getCheatsheetQuizAttempts(): Promise<ApiResponse<CheatsheetQuizAttempt[]>> {
    const result = await api.get<DataWrapper<CheatsheetQuizAttempt[]>>(
        "/api/cheatsheet/quiz/attempts",
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

export async function getCheatsheetQuizAttemptDetails(
    id: string,
): Promise<ApiResponse<CheatsheetQuizAttemptDetail>> {
    const result = await api.get<DataWrapper<CheatsheetQuizAttemptDetail>>(
        `/api/cheatsheet/quiz/attempts/${id}`,
    );

    if (!result.success) return result;
    return { success: true, data: result.data.data };
}
