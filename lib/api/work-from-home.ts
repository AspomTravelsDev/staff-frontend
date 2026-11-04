"use server";

import { api, type ApiResponse } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export interface WorkFromHomeRequest {
  id: number;
  user_id: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  user?: { id: string; name: string; email: string; staff_id?: string; department?: string };
  reviewer?: { id: string; name: string; email: string };
}

export interface WorkFromHomeFilters {
  status?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface WorkFromHomeStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approved_days: number;
}

export interface WorkFromHomePageData {
  data: WorkFromHomeRequest[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export async function getMyWorkFromHomeRequests(page = 1): Promise<ApiResponse<{ data: WorkFromHomeRequest[] | WorkFromHomePageData }>> {
  return api.get(`/api/work-from-home-requests/my?page=${page}`);
}

export async function submitWorkFromHomeRequest(payload: { start_date: string; end_date: string; reason: string }): Promise<ApiResponse<{ data: WorkFromHomeRequest }>> {
  const result = await api.post<{ data: WorkFromHomeRequest }>("/api/work-from-home-requests", payload);
  revalidatePath("/my/attendance");
  revalidatePath("/hr/work-from-home");
  revalidatePath("/hr/attendance-requests");
  return result;
}

function buildWorkFromHomeQuery(filters?: WorkFromHomeFilters): string {
  const params = new URLSearchParams();
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.per_page) params.set("per_page", String(filters.per_page));
  return params.size ? `?${params.toString()}` : "";
}

export async function getWorkFromHomeRequests(filters?: WorkFromHomeFilters): Promise<ApiResponse<{ message: string; code: string; data: WorkFromHomePageData }>> {
  return api.get<{ message: string; code: string; data: WorkFromHomePageData }>(`/api/work-from-home-requests${buildWorkFromHomeQuery(filters)}`);
}

export async function getWorkFromHomeStats(filters?: Pick<WorkFromHomeFilters, "from" | "to">): Promise<ApiResponse<{ message: string; code: string; data: WorkFromHomeStats }>> {
  return api.get<{ message: string; code: string; data: WorkFromHomeStats }>(`/api/work-from-home-requests/stats${buildWorkFromHomeQuery(filters)}`);
}

export async function getAllWorkFromHomeRequests(filters: Omit<WorkFromHomeFilters, "page" | "per_page">): Promise<WorkFromHomeRequest[]> {
  const all: WorkFromHomeRequest[] = [];
  let page = 1;
  let lastPage = 1;
  do {
    const result = await getWorkFromHomeRequests({ ...filters, page, per_page: 100 });
    if (!result.success) throw new Error(result.error.error || "Unable to export work-from-home requests.");
    all.push(...result.data.data.data);
    lastPage = result.data.data.last_page;
    page++;
  } while (page <= lastPage);
  return all;
}

export async function reviewWorkFromHomeRequest(id: number, payload: { status: "approved" | "rejected"; reviewer_note?: string }): Promise<ApiResponse<{ data: WorkFromHomeRequest }>> {
  const result = await api.patch<{ data: WorkFromHomeRequest }>(`/api/work-from-home-requests/${id}/review`, payload);
  revalidatePath("/hr/work-from-home");
  revalidatePath("/hr/attendance-requests");
  revalidatePath("/my/attendance");
  return result;
}

export async function revertWorkFromHomeRequest(id: number): Promise<ApiResponse<{ data: WorkFromHomeRequest }>> {
  const result = await api.post<{ data: WorkFromHomeRequest }>(`/api/work-from-home-requests/${id}/revert`, {});
  revalidatePath("/hr/work-from-home");
  revalidatePath("/hr/attendance-requests");
  revalidatePath("/my/attendance");
  return result;
}
