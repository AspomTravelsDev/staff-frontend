"use server";

import { api, type ApiResponse } from "./client";
import { revalidatePath } from "next/cache";
import type {
  TaskTrackerItem,
  TaskTrackerStats,
  TaskTrackerDashboardStats,
  CreateTaskTrackerPayload,
  UpdateTaskTrackerPayload,
  RequestTaskExtensionPayload,
  ApproveTaskExtensionPayload,
  RejectTaskExtensionPayload,
  Colleague,
} from "@/lib/types/task-tracker";

interface TaskTrackerListResponse {
  data: TaskTrackerItem[];
  stats: TaskTrackerStats;
}

interface TaskTrackerDashboardResponse {
  data: TaskTrackerItem[];
  stats: TaskTrackerDashboardStats;
}

interface SingleItemResponse {
  data: TaskTrackerItem;
  message?: string;
}

/**
 * Get active colleagues for assigning tasks company-wide
 */
export async function getTaskTrackerColleagues(): Promise<ApiResponse<{ data: Colleague[] }>> {
  return api.get<{ data: Colleague[] }>("/api/task-tracker/colleagues");
}

/**
 * Get task tracker items with stats for current user
 */
export async function getTaskTrackerItems(filters?: {
  status?: string;
  priority?: string;
  search?: string;
  view?: "assigned_to_me" | "assigned_by_me";
}): Promise<ApiResponse<TaskTrackerListResponse>> {
  const params = new URLSearchParams();
  if (filters?.view) params.set("view", filters.view);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.search) params.set("search", filters.search);

  const qs = params.toString();
  return api.get<TaskTrackerListResponse>(`/api/task-tracker${qs ? `?${qs}` : ""}`);
}

/**
 * Get dashboard summary of overdue and upcoming tasks
 */
export async function getTaskTrackerDashboardSummary(): Promise<ApiResponse<TaskTrackerDashboardResponse>> {
  return api.get<TaskTrackerDashboardResponse>("/api/task-tracker/dashboard-summary");
}

/**
 * Get a single task tracker item
 */
export async function getTaskTrackerItem(id: string): Promise<ApiResponse<SingleItemResponse>> {
  return api.get<SingleItemResponse>(`/api/task-tracker/${id}`);
}

/**
 * Create a new task tracker item (or assign to colleague)
 */
export async function createTaskTrackerItem(
  payload: CreateTaskTrackerPayload
): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>("/api/task-tracker", payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Update an existing task tracker item
 */
export async function updateTaskTrackerItem(
  id: string,
  payload: UpdateTaskTrackerPayload
): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.patch<SingleItemResponse>(`/api/task-tracker/${id}`, payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Toggle task completion status
 */
export async function toggleTaskTrackerItem(id: string): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>(`/api/task-tracker/${id}/toggle`);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Delete a task tracker item
 */
export async function deleteTaskTrackerItem(id: string): Promise<ApiResponse<{ message: string }>> {
  const result = await api.delete<{ message: string }>(`/api/task-tracker/${id}`);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Request a deadline extension on an assigned task (Assignee)
 */
export async function requestTaskExtension(
  id: string,
  payload: RequestTaskExtensionPayload
): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>(`/api/task-tracker/${id}/request-extension`, payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Approve a deadline extension request (Assigner)
 */
export async function approveTaskExtension(
  id: string,
  payload: ApproveTaskExtensionPayload = {}
): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>(`/api/task-tracker/${id}/approve-extension`, payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}

/**
 * Reject a deadline extension request (Assigner)
 */
export async function rejectTaskExtension(
  id: string,
  payload: RejectTaskExtensionPayload = {}
): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>(`/api/task-tracker/${id}/reject-extension`, payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/dashboard");
  }
  return result;
}
