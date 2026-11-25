"use server";

import { api } from "./client";
import type {
  BatchPipelineEmailPreview,
  RecruitmentEmails,
  RecruitmentEmailInput,
  RecruitmentEmailRecord,
} from "@/lib/types/recruitment-email";

export async function getRecruitmentEmails(candidateId: string) {
  const response = await api.get<{ data: RecruitmentEmails }>(
    `/api/recruitment/candidates/${candidateId}/emails`,
  );
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function sendRecruitmentEmail(
  candidateId: string,
  input: RecruitmentEmailInput,
) {
  const response = await api.post<{ data: RecruitmentEmailRecord }>(
    `/api/recruitment/candidates/${candidateId}/emails`, input,
  );
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function saveRecruitmentEmailDraft(candidateId: string, input: RecruitmentEmailInput) {
  const response = await api.patch<{ data: RecruitmentEmailRecord }>(`/api/recruitment/candidates/${candidateId}/emails`, input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function skipRecruitmentEmail(candidateId: string, input: RecruitmentEmailInput) {
  const response = await api.post<{ data: RecruitmentEmailRecord }>(`/api/recruitment/candidates/${candidateId}/emails/skip`, input);
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}

export async function getBatchRecruitmentEmailsPreview(roleId: string, candidateIds: string[]) {
  const response = await api.post<{ data: BatchPipelineEmailPreview }>(
    `/api/recruitment/roles/${roleId}/emails/batch-preview`,
    { candidate_ids: candidateIds },
  );
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function batchSkipRecruitmentEmails(roleId: string, candidateIds: string[]) {
  const response = await api.post<{ data: { skipped_ids: string[]; skipped_count: number } }>(
    `/api/recruitment/roles/${roleId}/emails/batch-skip`,
    { candidate_ids: candidateIds },
  );
  if (!response.success) return { success: false as const, error: response.error.error, code: response.error.code };
  return { success: true as const, data: response.data.data };
}
