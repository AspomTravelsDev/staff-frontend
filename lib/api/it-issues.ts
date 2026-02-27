"use server";

import { api, ApiResponse } from "./client";
import { revalidatePath } from "next/cache";

export type ItIssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type ItIssuePriority = "low" | "medium" | "high" | "critical";
export type ItIssueCategory = "hardware" | "software" | "network" | "other";

export interface ItIssue {
    id: string;
    subject: string;
    category: ItIssueCategory;
    priority: ItIssuePriority;
    description: string;
    status: ItIssueStatus;
    resolution_note: string | null;
    submitted_by_id: string;
    submitted_by?: {
        id: string;
        name: string;
        role: string;
    };
    created_at: string;
    updated_at: string;
}

export interface ItIssueStats {
    open: number;
    in_progress: number;
    resolved: number;
    critical: number;
}

export interface ItIssueFilters {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
}

export interface CreateItIssuePayload {
    subject: string;
    category: ItIssueCategory;
    priority: ItIssuePriority;
    description: string;
}

export interface UpdateItIssuePayload {
    status?: ItIssueStatus;
    resolution_note?: string | null;
}

export async function getItIssues(filters?: ItIssueFilters): Promise<ApiResponse<{
    data: ItIssue[];
    meta: { current_page: number; last_page: number; per_page: number; total: number };
}>> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.category) params.set("category", filters.category);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.page) params.set("page", String(filters.page));
    const qs = params.toString();
    return api.get(`/api/it-issues${qs ? `?${qs}` : ""}`);
}

export async function getItIssueStats(): Promise<ApiResponse<ItIssueStats>> {
    return api.get("/api/it-issues/stats/summary");
}

export async function createItIssue(payload: CreateItIssuePayload): Promise<ApiResponse<ItIssue>> {
    const result = await api.post<ItIssue>("/api/it-issues", payload);
    if (result.success) {
        revalidatePath("/my/it-issue");
        revalidatePath("/it/report-issues");
    }
    return result;
}

export async function updateItIssue(id: string, payload: UpdateItIssuePayload): Promise<ApiResponse<ItIssue>> {

    const result = await api.patch<ItIssue>(`/api/it-issues/${id}`, payload);
    if (result.success) {

        revalidatePath("/my/it-issue");
        revalidatePath("/it/report-issues");
    } else {
        console.error("[updateItIssue] ✗ error:", result.error);
    }
    return result;
}

export async function deleteItIssue(id: string): Promise<ApiResponse<null>> {
    const result = await api.delete<null>(`/api/it-issues/${id}`);
    if (result.success) {
        revalidatePath("/my/it-issue");
        revalidatePath("/it/report-issues");
    }
    return result;
}
