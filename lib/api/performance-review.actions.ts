"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { SelfAssessmentInput } from "@/lib/types/performance-appraisal";
import type { ReviewDetail, ReviewSummary } from "@/lib/types/performance-review";

export async function listAssignedReviews() {
  return runAction(async () => {
    const result = await api.get<{ data: { items: ReviewSummary[] } }>("/api/performance/reviews");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listAssignedReviews");
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
