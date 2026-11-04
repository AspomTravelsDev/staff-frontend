"use server";

import { runAction } from "./run-action";
import { ExpectedActionError } from "./action-result";
import { api } from "./client";
import type { AppraisalStats, AppraisalSummary, PerformanceAppraisal, SelfAssessmentInput } from "@/lib/types/performance-appraisal";

export async function getAppraisalHistory() {
  return runAction(async () => {
    const result = await api.get<{ data: { items: AppraisalSummary[] } }>("/api/performance/appraisals/mine");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data.items;
  }, "getAppraisalHistory");
}

export async function getAppraisalById(id: string) {
  return runAction(async () => {
    const result = await api.get<{ data: PerformanceAppraisal }>(`/api/performance/appraisals/${encodeURIComponent(id)}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getAppraisalById");
}

export async function getAppraisalStats() {
  return runAction(async () => {
    const result = await api.get<{ data: AppraisalStats }>("/api/performance/appraisals/mine/stats");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getAppraisalStats");
}

export async function saveSelfAppraisalDraft(id: string, data: SelfAssessmentInput) {
  return runAction(async () => {
    const result = await api.put<{ data: PerformanceAppraisal }>(`/api/performance/appraisals/${encodeURIComponent(id)}/self/draft`, data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "saveSelfAppraisalDraft");
}

export async function submitSelfAppraisal(id: string, data: SelfAssessmentInput) {
  return runAction(async () => {
    const result = await api.post<{ data: PerformanceAppraisal }>(`/api/performance/appraisals/${encodeURIComponent(id)}/self/submit`, data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "submitSelfAppraisal");
}
