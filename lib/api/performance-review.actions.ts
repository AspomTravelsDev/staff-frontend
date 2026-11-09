"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { SelfAssessmentInput } from "@/lib/types/performance-appraisal";
import type { ReviewDetail, ReviewQueueFilters, ReviewQueueResponse } from "@/lib/types/performance-review";

export async function listAvailableReviews(filters: ReviewQueueFilters) {
  return runAction(async () => {
    const params = new URLSearchParams({ search: filters.search, status: filters.status, type: filters.type, department: filters.department, page: String(filters.page) });
    if (filters.month) params.set("month", filters.month);
    const result = await api.get<{ data: ReviewQueueResponse }>(`/api/performance/reviews?${params.toString()}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listAvailableReviews");
}

export async function getAssignedReview(id: string) {
  return runAction(async () => {
    const result = await api.get<{ data: ReviewDetail }>(`/api/performance/reviews/${encodeURIComponent(id)}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getAssignedReview");
}

export async function saveReviewDraft(id: string, data: SelfAssessmentInput) {
  return runAction(async () => {
    const result = await api.put<{ data: ReviewDetail }>(`/api/performance/reviews/${encodeURIComponent(id)}/draft`, data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveReviewDraft");
}

export async function submitReview(id: string, data: SelfAssessmentInput) {
  return runAction(async () => {
    const result = await api.post<{ data: ReviewDetail }>(`/api/performance/reviews/${encodeURIComponent(id)}/submit`, data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "submitReview");
}
