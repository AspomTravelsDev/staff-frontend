"use server";

import { api, type ApiResponse } from "./client";
import type {
    DailyTaskRecord,
    TaskFilters,
    AllTaskFilters,
    CreateTaskRequest
} from "@/types/task-types";

interface DataWrapper<T> {
    data: T;
}

/**
 * Create or update today's daily tasks
 * POST /api/tasks/daily
 */
export async function updateDailyTasks(
    data: CreateTaskRequest
): Promise<ApiResponse<DailyTaskRecord>> {
    const result = await api.post<DataWrapper<DailyTaskRecord>>("/api/tasks/daily", data);
    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

/**
 * Get my daily tasks
 * GET /api/tasks/daily
 */
export async function getMyDailyTasks(
    filters: TaskFilters = {}
): Promise<ApiResponse<DailyTaskRecord[]>> {
    const params = new URLSearchParams();
    if (filters.date) params.append("date", filters.date);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);

    const result = await api.get<DataWrapper<DailyTaskRecord[]>>(`/api/tasks/daily?${params.toString()}`);
    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

/**
 * Submit end-of-day report
 * POST /api/tasks/daily/submit
 */
export async function submitDailyReport(): Promise<ApiResponse<DailyTaskRecord>> {
    const result = await api.post<DataWrapper<DailyTaskRecord>>("/api/tasks/daily/submit");
    if (!result.success) return result;
    return { success: true, data: result.data.data };
}

/**
 * Get all daily tasks (HR/Super only)
 * GET /api/tasks/daily/all
 */
export async function getAllDailyTasks(
    filters: AllTaskFilters = {}
): Promise<ApiResponse<DailyTaskRecord[]>> {
    const params = new URLSearchParams();
    if (filters.date) params.append("date", filters.date);
    if (filters.start_date) params.append("start_date", filters.start_date);
    if (filters.end_date) params.append("end_date", filters.end_date);
    if (filters.user_id) params.append("user_id", filters.user_id);
    if (filters.report_submitted !== undefined) {
        params.append("report_submitted", String(filters.report_submitted));
    }

    const result = await api.get<DataWrapper<DailyTaskRecord[]>>(`/api/tasks/daily/all?${params.toString()}`);
    if (!result.success) return result;
    return { success: true, data: result.data.data };
}
