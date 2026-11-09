"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { PerformanceResultDetail, PerformanceResultFilters, PerformanceResults } from "@/lib/types/performance-result";

export async function getCompletedResults(filters: PerformanceResultFilters = {}) {
  return runAction(async () => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.department) params.set("department", filters.department);
    if (filters.month) params.set("month", filters.month);
    if (filters.type) params.set("type", filters.type);
    if (filters.page) params.set("page", String(filters.page));
    const result = await api.get<{ data: PerformanceResults }>(`/api/performance/results${params.size ? `?${params}` : ""}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getCompletedResults");
}

export async function getCompletedResult(id: string) {
  return runAction(async () => {
    const result = await api.get<{ data: PerformanceResultDetail }>(`/api/performance/results/${encodeURIComponent(id)}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getCompletedResult");
}
