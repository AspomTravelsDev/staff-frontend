"use server";

import { api } from "./client";
import { ExpectedActionError } from "./action-result";
import { runAction } from "./run-action";
import type { PerformancePeriod, PeriodDetail, PeriodInput, PeriodPreview, PeriodStaff } from "@/lib/types/performance-period";

export async function listPerformancePeriods() {
  return runAction(async () => {
    const result = await api.get<{ data: { items: PerformancePeriod[] } }>("/api/performance/periods");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "listPerformancePeriods");
}

export async function getPerformancePeriodOptions() {
  return runAction(async () => {
    const result = await api.get<{ data: { staff: PeriodStaff[] } }>("/api/performance/periods/options");
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getPerformancePeriodOptions");
}

export async function getPerformancePeriod(id: string) {
  return runAction(async () => {
    const result = await api.get<{ data: PeriodDetail }>(`/api/performance/periods/${encodeURIComponent(id)}`);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "getPerformancePeriod");
}

export async function savePerformancePeriod(id: string | null, data: PeriodInput) {
  return runAction(async () => {
    const result = id
      ? await api.patch<{ data: PerformancePeriod }>(`/api/performance/periods/${encodeURIComponent(id)}`, data)
      : await api.post<{ data: PerformancePeriod }>("/api/performance/periods", data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "savePerformancePeriod");
}

export async function previewPerformancePeriod(id: string) {
  return runAction(async () => {
    const result = await api.post<{ data: PeriodPreview }>(`/api/performance/periods/${encodeURIComponent(id)}/preview`, {});
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "previewPerformancePeriod");
}

export async function openPerformancePeriod(id: string, previewToken: string) {
  return runAction(async () => {
    const result = await api.post<{ data: PerformancePeriod }>(`/api/performance/periods/${encodeURIComponent(id)}/open`, { preview_token: previewToken });
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "openPerformancePeriod");
}

export async function openAppraisalCycleWindow(
  data: { type?: "monthly_kpi" | "appraisal"; month?: string; submission_deadline?: string } = {},
) {
  return runAction(async () => {
    const result = await api.post<{ data: PerformancePeriod }>("/api/performance/periods/appraisal/open", data);
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "openAppraisalCycleWindow");
}

export async function closePerformancePeriod(id: string) {
  return runAction(async () => {
    const result = await api.post<{ data: PerformancePeriod }>(`/api/performance/periods/${encodeURIComponent(id)}/close`, {});
    if (!result.success) throw new ExpectedActionError(result.error.error, result.error.code);
    return result.data.data;
  }, "closePerformancePeriod");
}
