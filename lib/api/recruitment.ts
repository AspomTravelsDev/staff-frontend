"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";
import type { AssessmentConfiguration } from "@/lib/types/applicant-assessment";
import type {
  RecruitmentRole,
  RoleDetailResponse,
  CandidateStatus,
  OnboardCandidatePayload,
  RecruitmentCandidate,
  InterviewRubric,
} from "@/lib/types/recruitment";

export async function getRecruitmentRoles(): Promise<RecruitmentRole[]> {
  const response = await api.get<{ data: RecruitmentRole[] }>("/api/recruitment/roles");
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export async function getRecruitmentRole(id: string): Promise<RoleDetailResponse> {
  const response = await api.get<{ data: RoleDetailResponse }>(`/api/recruitment/roles/${id}`);
  if (!response.success) throw new Error(response.error.error);
  return response.data.data;
}

export type RecruitmentActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
};

export async function createRecruitmentRole(data: {
  title: string;
  department: string;
  openings_count: number;
  employment_type: string;
  job_description?: string;
  custom_instructions?: string;
  hr_request_id?: string;
  assessment?: AssessmentConfiguration;
  pipeline_settings?: import("@/lib/types/recruitment-pipeline").PipelineSettings;
  salary_budget_min?:number;
  salary_budget_max?:number;
}): Promise<RecruitmentActionResult<RecruitmentRole>> {
  const response = await api.post<{ data: RecruitmentRole }>("/api/recruitment/roles", data);
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to create recruitment role" };
  }
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/staff-requests");
  return { success: true, data: response.data.data };
}

export async function updateRecruitmentRole(
  id: string,
  data: Partial<{
    title: string;
    department: string;
    openings_count: number;
    employment_type: string;
    job_description: string;
    custom_instructions: string;
    status: "active" | "paused" | "closed";
  }>
): Promise<RecruitmentActionResult<RecruitmentRole>> {
  const response = await api.put<{ data: RecruitmentRole }>(`/api/recruitment/roles/${id}`, data);
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to update recruitment role" };
  }
  revalidatePath(`/hr/recruitment/${id}`);
  revalidatePath("/hr/recruitment");
  return { success: true, data: response.data.data };
}

export async function deleteRecruitmentRole(id: string): Promise<RecruitmentActionResult<void>> {
  const response = await api.delete(`/api/recruitment/roles/${id}`);
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to delete recruitment role" };
  }
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/staff-requests");
  return { success: true };
}

export async function deleteRecruitmentCandidate(
  candidateId: string,
  roleId: string
): Promise<RecruitmentActionResult<void>> {
  const response = await api.delete(`/api/recruitment/roles/${roleId}/candidates/${candidateId}`);
  if (!response.success) {
    return {
      success: false,
      error: response.error.error || "Failed to delete recruitment candidate",
      errorCode: response.error.code,
    };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/recruitment");
  return { success: true };
}

export async function uploadCandidateCv(
  roleId: string,
  formData: FormData
): Promise<RecruitmentActionResult<RecruitmentCandidate>> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/roles/${roleId}/candidates`,
    formData
  );
  if (!response.success) {
    // Keep the backend code visible in the server-action response, and log no
    // credentials, candidate details, CV contents, or raw upstream response.
    console.error("[Recruitment CV upload failed]", {
      roleId,
      code: response.error.code,
    });
    return {
      success: false,
      error: response.error?.error || "Failed to upload candidate CV",
      errorCode: response.error.code,
    };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/recruitment");
  return { success: true, data: response.data.data };
}

export async function reanalyzeCandidate(
  candidateId: string,
  roleId: string
): Promise<RecruitmentActionResult<RecruitmentCandidate>> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/reanalyze`
  );
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to reanalyze candidate" };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true, data: response.data.data };
}

export async function updateCandidateStatus(
  candidateId: string,
  roleId: string,
  status: CandidateStatus,
  notes?: string
): Promise<RecruitmentActionResult<RecruitmentCandidate>> {
  const response = await api.patch<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/status`,
    { status, notes }
  );
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to update candidate status" };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/recruitment");
  return { success: true, data: response.data.data };
}

export async function onboardCandidateAction(
  candidateId: string,
  roleId: string,
  payload: OnboardCandidatePayload
): Promise<RecruitmentActionResult<any>> {
  const response = await api.post<{ data: any }>(
    `/api/recruitment/candidates/${candidateId}/onboard`,
    payload
  );
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to onboard candidate" };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/applications");
  return { success: true, data: response.data.data };
}

export async function saveCandidateRubricAction(
  candidateId: string,
  roleId: string,
  rubric: InterviewRubric
): Promise<RecruitmentActionResult<RecruitmentCandidate>> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/rubric`,
    { rubric }
  );
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to save interview rubric" };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true, data: response.data.data };
}

export async function analyzeInterviewAction(
  candidateId: string,
  roleId: string,
  offeringSalary?: number
): Promise<RecruitmentActionResult<RecruitmentCandidate>> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/analyze-interview`,
    { offering_salary: offeringSalary }
  );
  if (!response.success) {
    return { success: false, error: response.error?.error || "Failed to analyze interview" };
  }
  revalidatePath(`/hr/recruitment/${roleId}`);
  return { success: true, data: response.data.data };
}

