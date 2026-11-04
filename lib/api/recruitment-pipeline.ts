"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";
import type {
  PipelineContext,
  PipelinePayload,
  PipelineSettings,
  PipelineStage,
  ManagementReview,
  ManagementShortlist,
  ManagementDecisionType,
} from "@/lib/types/recruitment-pipeline";
import type {
  RecruitmentRole,
  RecruitmentCandidate,
} from "@/lib/types/recruitment";

export async function getRecruitmentPipeline(candidateId: string) {
  const response = await api.get<{ data: PipelineContext }>(
    `/api/recruitment/candidates/${candidateId}/pipeline`,
  );
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}
export async function getRecruitmentOffer(candidateId: string) {
  const response = await api.get<{
    data: {
      candidate: Pick<
        RecruitmentCandidate,
        "id" | "name" | "email" | "status" | "onboarding_application_id"
      >;
      application: null | {
        id: string;
        applicant_name: string;
        applicant_email: string;
        position_title: string;
        employment_terms: {
          gross_salary: number;
          effective_date: string;
          reporting_to: string;
          is_tax_exempt: boolean;
        };
        offer: { state: string; sent_at?: string };
      };
    };
  }>(`/api/recruitment/candidates/${candidateId}/offer-preparation`);
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}
export async function getManagementShortlist(roleId: string) {
  const response = await api.get<{ data: ManagementShortlist }>(
    `/api/recruitment/roles/${roleId}/management-reviews`,
  );
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}
export async function getManagementReview(
  candidateId: string,
  version?: number,
) {
  const response = await api.get<{ data: ManagementReview }>(
    `/api/recruitment/candidates/${candidateId}/management-review${version ? `?version=${version}` : ""}`,
  );
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}
export async function decideManagementReview(
  candidateId: string,
  roleId: string,
  input: {
    review_id: string;
    decision: ManagementDecisionType;
    reason?: string;
    follow_up_date?: string;
  },
) {
  const response = await api.post<{ data: ManagementReview }>(
    `/api/recruitment/candidates/${candidateId}/management-review/decision`,
    input,
  );
  if (!response.success)
    return {
      success: false as const,
      error: response.error.error,
      errorCode: response.error.code,
    };
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true as const, data: response.data.data };
}
export async function getRecruitmentScreeningStatus(candidateId: string) {
  const response = await api.get<{
    data: Pick<
      RecruitmentCandidate,
      "id" | "ai_score" | "ai_summary" | "ai_evaluation" | "cv_extracted_text"
    > & { interview_preparation?: import("@/lib/types/recruitment").InterviewPreparation | null };
  }>(`/api/recruitment/candidates/${candidateId}/screening-status`);
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}
export async function saveRecruitmentStage(
  candidateId: string,
  roleId: string,
  input: {
    revision: number;
    stage: PipelineStage;
    payload: PipelinePayload;
    complete: boolean;
    advance?: boolean;
  },
) {
  const response = await api.patch<{ data: PipelineContext }>(
    `/api/recruitment/candidates/${candidateId}/pipeline`,
    input,
  );
  if (!response.success)
    return {
      success: false as const,
      error: response.error.error,
      errorCode: response.error.code,
    };
  if (input.complete) revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true as const, data: response.data.data };
}
export async function decideRecruitmentStage(
  candidateId: string,
  roleId: string,
  input: {
    revision: number;
    stage: PipelineStage;
    action: string;
    reason?: string;
    follow_up_date?: string;
    complete_cv?: boolean;
    manual_cv?: boolean;
  },
) {
  const response = await api.post<{ data: PipelineContext }>(
    `/api/recruitment/candidates/${candidateId}/pipeline/decision`,
    input,
  );
  if (!response.success)
    return {
      success: false as const,
      error: response.error.error,
      errorCode: response.error.code,
    };
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true as const, data: response.data.data };
}
export async function saveRecruitmentPipelineSettings(
  roleId: string,
  input: PipelineSettings & {
    salary_budget_min: number;
    salary_budget_max: number;
  },
) {
  const response = await api.put<{ data: RecruitmentRole }>(
    `/api/recruitment/roles/${roleId}/pipeline-settings`,
    input,
  );
  if (!response.success)
    return { success: false as const, error: response.error.error };
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true as const, data: response.data.data };
}

export async function reportRecruitmentOfferFailure(
  candidateId: string,
  applicationId: string,
  generation: string,
) {
  const result = await api.post(
    `/api/recruitment/candidates/${candidateId}/offer-failure`,
    { application_id: applicationId, generation },
  );
  return result.success;
}

export async function generateRecruitmentOfferDocuments(
  candidateId: string,
  applicationId: string,
  generation: string,
) {
  try {
    const { downloadPdfFormsAction } = await import(
      "@/app/(public)/applicant/[id]/pdf-actions"
    );
    const result = await downloadPdfFormsAction(applicationId, {
      includeAdminOnly: true,
    });
    if (result?.error) {
      try {
        await reportRecruitmentOfferFailure(
          candidateId,
          applicationId,
          generation,
        );
      } catch {
        /* Keep the original document error. */
      }
    }
    return result;
  } catch (error) {
    try {
      await reportRecruitmentOfferFailure(
        candidateId,
        applicationId,
        generation,
      );
    } catch {
      /* Keep the original document error. */
    }
    throw error;
  }
}
