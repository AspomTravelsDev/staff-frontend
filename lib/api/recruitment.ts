"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";
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

export async function createRecruitmentRole(data: {
  title: string;
  department: string;
  openings_count: number;
  employment_type: string;
  job_description?: string;
  custom_instructions?: string;
  hr_request_id?: string;
}): Promise<RecruitmentRole> {
  const response = await api.post<{ data: RecruitmentRole }>("/api/recruitment/roles", data);
  if (!response.success) throw new Error(response.error.error);
  revalidatePath("/hr/recruitment");
  revalidatePath("/hr/staff-requests");
  return response.data.data;
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
): Promise<RecruitmentRole> {
  const response = await api.put<{ data: RecruitmentRole }>(`/api/recruitment/roles/${id}`, data);
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${id}`);
  revalidatePath("/hr/recruitment");
  return response.data.data;
}

export async function deleteRecruitmentRole(id: string): Promise<void> {
  const response = await api.delete(`/api/recruitment/roles/${id}`);
  if (!response.success) throw new Error(response.error.error);
  revalidatePath("/hr/recruitment");
}

export async function uploadCandidateCv(
  roleId: string,
  formData: FormData
): Promise<RecruitmentCandidate> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/roles/${roleId}/candidates`,
    formData
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/recruitment");
  return response.data.data;
}

export async function reanalyzeCandidate(
  candidateId: string,
  roleId: string
): Promise<RecruitmentCandidate> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/reanalyze`
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  return response.data.data;
}

export async function updateCandidateStatus(
  candidateId: string,
  roleId: string,
  status: CandidateStatus,
  notes?: string
): Promise<RecruitmentCandidate> {
  const response = await api.patch<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/status`,
    { status, notes }
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/recruitment");
  return response.data.data;
}

export async function onboardCandidateAction(
  candidateId: string,
  roleId: string,
  payload: OnboardCandidatePayload
): Promise<any> {
  const response = await api.post<{ data: any }>(
    `/api/recruitment/candidates/${candidateId}/onboard`,
    payload
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  revalidatePath("/hr/applications");
  return response.data.data;
}

export async function saveCandidateRubricAction(
  candidateId: string,
  roleId: string,
  rubric: InterviewRubric
): Promise<RecruitmentCandidate> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/rubric`,
    { rubric }
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  return response.data.data;
}

export async function analyzeInterviewAction(
  candidateId: string,
  roleId: string,
  offeringSalary?: number
): Promise<RecruitmentCandidate> {
  const response = await api.post<{ data: RecruitmentCandidate }>(
    `/api/recruitment/candidates/${candidateId}/analyze-interview`,
    { offering_salary: offeringSalary }
  );
  if (!response.success) throw new Error(response.error.error);
  revalidatePath(`/hr/recruitment/${roleId}`);
  return response.data.data;
}

