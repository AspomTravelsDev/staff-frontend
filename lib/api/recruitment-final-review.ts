"use server";

import { api } from "./client";
import type { RecruitmentFinalReview } from "@/lib/types/recruitment-final-review";

export async function getRecruitmentFinalReview(candidateId: string) {
  const response = await api.get<{ data: RecruitmentFinalReview }>(`/api/recruitment/candidates/${candidateId}/final-review`);
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function saveRecruitmentFinalComments(candidateId: string, revision: number, hrComments: string) {
  const response = await api.patch<{ data: RecruitmentFinalReview }>(`/api/recruitment/candidates/${candidateId}/final-review`, { revision, hr_comments: hrComments });
  if (!response.success) return { success: false as const, error: response.error.error };
  return { success: true as const, data: response.data.data };
}

export async function generateRecruitmentFinalReview(candidateId: string, revision: number) {
  const response = await api.post<{ data: RecruitmentFinalReview }>(`/api/recruitment/candidates/${candidateId}/final-review/analyze`, { revision });
  if (!response.success) return { success: false as const, error: response.error.error };
  return { success: true as const, data: response.data.data };
}
