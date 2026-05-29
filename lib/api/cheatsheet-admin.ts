"use server";

import { api } from "./client";
import type { PaginatedResponse } from "./types";
import { revalidatePath } from "next/cache";
import type {
    CheatsheetAnalytics,
    CheatsheetItemAdmin,
    CheatsheetQuestionAdmin,
    CheatsheetSource,
    CheatsheetQuizAttempt,
} from "@/types/cheatsheet-types";

interface DataWrapper<T> {
    data: T;
}

export interface CheatsheetSourceFilters {
    page?: number;
    limit?: number;
    status?: "draft" | "active" | "archived";
}

export interface CheatsheetItemFilters {
    page?: number;
    limit?: number;
    source_id?: string;
    category?: string;
    is_active?: boolean;
}

export interface CheatsheetQuestionFilters {
    page?: number;
    limit?: number;
    source_id?: string;
    category?: string;
    is_active?: boolean;
}

export async function getCheatsheetSources(
    filters: CheatsheetSourceFilters = {},
): Promise<PaginatedResponse<CheatsheetSource>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);

    const result = await api.get<{
        data: CheatsheetSource[];
        pagination: PaginatedResponse<CheatsheetSource>["pagination"];
    }>(`/api/cheatsheet/sources?${params.toString()}`);

    if (!result.success) {
        return {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        };
    }

    return {
        items: result.data.data,
        pagination: result.data.pagination,
    };
}

export async function createCheatsheetSource(payload: {
    title?: string | null;
    content: string;
}): Promise<CheatsheetSource> {
    const result = await api.post<DataWrapper<CheatsheetSource>>(
        "/api/cheatsheet/sources",
        payload,
    );

    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    return result.data.data;
}

export async function updateCheatsheetSource(
    id: string,
    payload: Partial<{
        title: string | null;
        content: string;
        status: "draft" | "active" | "archived";
        metadata: Record<string, unknown> | null;
    }>,
): Promise<CheatsheetSource> {
    const result = await api.patch<DataWrapper<CheatsheetSource>>(
        `/api/cheatsheet/sources/${id}`,
        payload,
    );

    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    return result.data.data;
}

export async function extractCheatsheetSource(id: string): Promise<void> {
    const result = await api.post<{ message: string }>(
        `/api/cheatsheet/sources/${id}/extract`,
    );

    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
}

export async function getCheatsheetItems(
    filters: CheatsheetItemFilters = {},
): Promise<PaginatedResponse<CheatsheetItemAdmin>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.source_id) params.append("source_id", filters.source_id);
    if (filters.category) params.append("category", filters.category);
    if (typeof filters.is_active === "boolean") {
        params.append("is_active", String(filters.is_active));
    }

    const result = await api.get<{
        data: CheatsheetItemAdmin[];
        pagination: PaginatedResponse<CheatsheetItemAdmin>["pagination"];
    }>(`/api/cheatsheet/items?${params.toString()}`);

    if (!result.success) {
        return {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        };
    }

    return {
        items: result.data.data,
        pagination: result.data.pagination,
    };
}

export async function updateCheatsheetItem(
    id: string,
    payload: Partial<{
        title: string;
        content: string;
        category: string | null;
        metadata: Record<string, unknown> | null;
        is_active: boolean;
    }>,
): Promise<CheatsheetItemAdmin> {
    const result = await api.patch<DataWrapper<CheatsheetItemAdmin>>(
        `/api/cheatsheet/items/${id}`,
        payload,
    );

    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    revalidatePath("/dashboard");
    return result.data.data;
}

export async function getCheatsheetQuestions(
    filters: CheatsheetQuestionFilters = {},
): Promise<PaginatedResponse<CheatsheetQuestionAdmin>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.source_id) params.append("source_id", filters.source_id);
    if (filters.category) params.append("category", filters.category);
    if (typeof filters.is_active === "boolean") {
        params.append("is_active", String(filters.is_active));
    }

    const result = await api.get<{
        data: CheatsheetQuestionAdmin[];
        pagination: PaginatedResponse<CheatsheetQuestionAdmin>["pagination"];
    }>(`/api/cheatsheet/questions?${params.toString()}`);

    if (!result.success) {
        return {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        };
    }

    return {
        items: result.data.data,
        pagination: result.data.pagination,
    };
}

export async function updateCheatsheetQuestion(
    id: string,
    payload: Partial<{
        question: string;
        options: string[];
        correct_option: string;
        explanation: string | null;
        category: string | null;
        is_active: boolean;
    }>,
): Promise<CheatsheetQuestionAdmin> {
    const result = await api.patch<DataWrapper<CheatsheetQuestionAdmin>>(
        `/api/cheatsheet/questions/${id}`,
        payload,
    );

    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    revalidatePath("/my/cheatsheet-quiz");
    return result.data.data;
}

export async function deleteCheatsheetItem(id: string): Promise<void> {
    const result = await api.delete<{ message: string }>(`/api/cheatsheet/items/${id}`);
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    revalidatePath("/dashboard");
}

export async function deleteCheatsheetQuestion(id: string): Promise<void> {
    const result = await api.delete<{ message: string }>(`/api/cheatsheet/questions/${id}`);
    if (!result.success) throw new Error(result.error.error);
    revalidatePath("/admin/cheatsheet");
    revalidatePath("/my/cheatsheet-quiz");
}

export async function getCheatsheetAnalytics(): Promise<CheatsheetAnalytics | null> {
    const result = await api.get<DataWrapper<CheatsheetAnalytics>>(
        "/api/cheatsheet/analytics",
    );

    if (!result.success) return null;
    return result.data.data;
}

export async function getAdminDepartmentAttempts(department: string): Promise<CheatsheetQuizAttempt[]> {
    const result = await api.get<DataWrapper<CheatsheetQuizAttempt[]>>(
        `/api/cheatsheet/admin/attempts?department=${encodeURIComponent(department)}`,
    );

    if (!result.success) throw new Error(result.error.error);
    return result.data.data;
}
