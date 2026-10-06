"use server";

import { api, type ApiResponse } from "./client";
import { revalidatePath } from "next/cache";
import type {
  TaskTrackerItem,
  TaskTrackerStats,
  TaskTrackerDashboardStats,
  CompanyDelegatedTaskStats,
  CreateTaskTrackerPayload,
  UpdateTaskTrackerPayload,
  RequestTaskExtensionPayload,
  ApproveTaskExtensionPayload,
  RejectTaskExtensionPayload,
  Colleague,
  TaskTrackerComment,
} from "@/lib/types/task-tracker";

export async function runTaskWorkflow(id: string, payload: {
  action: "start" | "submit" | "accept" | "request_changes" | "cancel" | "reopen";
  note?: string;
  url?: string | null;
}): Promise<ApiResponse<SingleItemResponse>> {
  const result = await api.post<SingleItemResponse>(`/api/task-tracker/${id}/workflow`, payload);
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/operations/delegated-tasks");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function getTaskHistory(id: string): Promise<ApiResponse<{ data: {
  id: number;
  type: string;
  details: Record<string, unknown>;
  created_at: string;
  user?: { name: string } | null;
}[] }>> {
  return api.get(`/api/task-tracker/${id}/history`);
}

export async function getTaskUpdateReceipt(id: string, kind?: "comment") {
  return api.get<{ latest_id: number | null }>(`/api/task-tracker/${id}/update-receipt${kind ? "?kind=comment" : ""}`);
}

export async function markTaskUpdatesViewed(id: string, throughId: number, kind?: "comment") {
  return api.post<{ message: string }>(`/api/task-tracker/${id}/updates/mark-viewed`, { through_id: throughId, kind });
}

interface TaskTrackerListResponse {
  data: TaskTrackerItem[];
  stats: TaskTrackerStats;
}

interface CompanyDelegatedTasksResponse {
  data: TaskTrackerItem[];
  stats: CompanyDelegatedTaskStats;
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

export async function getTaskTrackerComments(
  id: string,
): Promise<ApiResponse<{ data: TaskTrackerComment[] }>> {
  return api.get<{ data: TaskTrackerComment[] }>(`/api/task-tracker/${id}/comments`);
}

export async function addTaskTrackerComment(
  id: string,
  body: string,
): Promise<ApiResponse<{ data: TaskTrackerComment; message: string }>> {
  const result = await api.post<{ data: TaskTrackerComment; message: string }>(
    `/api/task-tracker/${id}/comments`,
    { body },
  );
  if (result.success) {
    revalidatePath("/my/task-tracker");
    revalidatePath("/operations/delegated-tasks");
  }
  return result;
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
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
    revalidatePath("/operations/delegated-tasks");
    revalidatePath("/operations/delegated-tasks");
  }
  return result;
}

/**
 * Get company-wide delegated tasks (Office Operations & Management oversight)
 */
export async function getCompanyDelegatedTasks(filters?: {
  status?: string;
  priority?: string;
  department?: string;
  search?: string;
}): Promise<ApiResponse<CompanyDelegatedTasksResponse>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.department) params.set("department", filters.department);
  if (filters?.search) params.set("search", filters.search);

  const qs = params.toString();
  return api.get<CompanyDelegatedTasksResponse>(`/api/task-tracker/company-delegated${qs ? `?${qs}` : ""}`);
}

/**
 * Nudge task assignee with a real-time reminder notification (Office Operations)
 */
export async function nudgeTaskAssignee(
  id: string,
  payload: { message?: string } = {}
): Promise<ApiResponse<{ message: string }>> {
  return api.post<{ message: string }>(`/api/task-tracker/${id}/nudge`, payload);
}
