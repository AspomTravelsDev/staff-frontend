"use server";

import { api, type ApiResponse } from "./client";
import type {
  DailyTaskRecord,
  TaskFilters,
  AllTaskFilters,
  CreateTaskRequest,
} from "@/types/task-types";

interface DataWrapper<T> {
  data: T;
}

/**
 * Create or update today's daily tasks
 * POST /api/tasks/daily
 */
export async function updateDailyTasks(
  data: CreateTaskRequest,
): Promise<ApiResponse<DailyTaskRecord>> {
  const result = await api.post<DataWrapper<DailyTaskRecord>>(
    "/api/tasks/daily",
    data,
  );
  if (!result.success) return result;
  return { success: true, data: result.data.data };
}

/**
 * Get my daily tasks
 * GET /api/tasks/daily
 */
export async function getMyDailyTasks(
  filters: TaskFilters = {},
): Promise<ApiResponse<DailyTaskRecord[]>> {
  const params = new URLSearchParams();
  if (filters.date) params.append("date", filters.date);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);

  const result = await api.get<DataWrapper<DailyTaskRecord[]>>(
    `/api/tasks/daily?${params.toString()}`,
  );
  if (!result.success) return result;
  return { success: true, data: result.data.data };
}

/**
 * Submit end-of-day report
 * POST /api/tasks/daily/submit
 */
export async function submitDailyReport(): Promise<
  ApiResponse<DailyTaskRecord>
> {
  const result = await api.post<DataWrapper<DailyTaskRecord>>(
    "/api/tasks/daily/submit",
  );
  if (!result.success) return result;
  return { success: true, data: result.data.data };
}

/**
 * Get all daily tasks (HR/Super only)
 * GET /api/tasks/daily/all
 */
export async function getAllDailyTasks(
  filters: AllTaskFilters = {},
): Promise<ApiResponse<DailyTaskRecord[]>> {
  const params = new URLSearchParams();
  if (filters.date) params.append("date", filters.date);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", filters.user_id);
  if (filters.report_submitted !== undefined) {
    params.append("report_submitted", String(filters.report_submitted));
  }

  const result = await api.get<DataWrapper<DailyTaskRecord[]>>(
    `/api/tasks/daily/all?${params.toString()}`,
  );
  if (!result.success) return result;
  return { success: true, data: result.data.data };
}

export async function getDailyTasksOverview(filters: AllTaskFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== undefined) params.set(key, String(value));
  const response = await api.get<{
    data: DailyTaskRecord[];
    can_backfill: boolean;
    backfill_users: { id: string; name: string; staff_id: string }[];
  }>(`/api/tasks/daily/all?${params}`);
  if (!response.success)
    throw new Error(response.error.error || "Failed to load tasks");
  return response.data;
}
export async function getDailyTaskBackfill(userId: string, date: string) {
  const response = await api.get<{
    data: DailyTaskRecord | null;
    version: string | null;
  }>(
    `/api/tasks/daily/backfill?${new URLSearchParams({ user_id: userId, date })}`,
  );
  if (!response.success)
    throw new Error(response.error.error || "Could not load this record");
  return response.data;
}
export async function saveDailyTaskBackfill(input: {
  user_id: string;
  date: string;
  version: string | null;
  tasks: import("@/types/task-types").TaskItem[];
  submit: boolean;
}) {
  const response = await api.post<{ data: DailyTaskRecord; version: string }>(
    "/api/tasks/daily/backfill",
    input,
  );
  if (!response.success)
    throw new Error(response.error.error || "Could not save this record");
  return response.data;
}
