"use server";

import { api } from "./client";
import { revalidatePath } from "next/cache";
import type {
  ApplicantAssessment,
  AssessmentActionResult,
  AssessmentBank,
  AssessmentConfiguration,
  AssessmentContext,
  AssessmentDraft,
  AssessmentPlan,
  AssessmentRevision,
} from "@/lib/types/applicant-assessment";

async function request<T>(
  method: "get" | "post" | "put" | "patch",
  endpoint: string,
  body?: unknown,
): Promise<AssessmentActionResult<T>> {
  const response =
    method === "get"
      ? await api.get<{ data: T }>(endpoint)
      : await api[method]<{ data: T }>(endpoint, body);
  if (!response.success)
    return {
      success: false,
      error: response.error.error,
      errorCode: response.error.code,
    };
  return { success: true, data: response.data.data };
}
export async function getAssessmentBank() {
  return request<AssessmentBank>("get", "/api/recruitment/assessment-bank");
}
export async function getAssessmentPlan(roleId: string) {
  return request<AssessmentPlan | null>(
    "get",
    `/api/recruitment/roles/${roleId}/assessment-plan`,
  );
}
export async function saveAssessmentPlan(
  roleId: string,
  data: AssessmentConfiguration & { revision: number },
) {
  const result = await request<AssessmentPlan>(
    "put",
    `/api/recruitment/roles/${roleId}/assessment-plan`,
    data,
  );
  if (result.success) revalidatePath(`/hr/recruitment/${roleId}`);
  return result;
}
export async function getApplicantAssessment(candidateId: string) {
  return request<AssessmentContext>(
    "get",
    `/api/recruitment/candidates/${candidateId}/assessment`,
  );
}
export async function startApplicantAssessment(
  candidateId: string,
  roleId: string,
) {
  const result = await request<ApplicantAssessment>(
    "post",
    `/api/recruitment/candidates/${candidateId}/assessment`,
  );
  if (result.success) revalidatePath(`/hr/recruitment/${roleId}`);
  return result;
}
export async function saveApplicantAssessment(
  candidateId: string,
  data: AssessmentDraft & { revision: number },
) {
  return request<ApplicantAssessment>(
    "patch",
    `/api/recruitment/candidates/${candidateId}/assessment`,
    data,
  );
}
export async function submitApplicantAssessment(
  candidateId: string,
  roleId: string,
  data: AssessmentDraft & { revision: number },
) {
  const result = await request<ApplicantAssessment>(
    "post",
    `/api/recruitment/candidates/${candidateId}/assessment/submit`,
    data,
  );
  if (result.success) revalidatePath(`/hr/recruitment/${roleId}`);
  return result;
}
export async function reopenApplicantAssessment(
  candidateId: string,
  roleId: string,
  revision: number,
  reason: string,
) {
  const result = await request<ApplicantAssessment>(
    "post",
    `/api/recruitment/candidates/${candidateId}/assessment/reopen`,
    { revision, reason },
  );
  if (result.success) revalidatePath(`/hr/recruitment/${roleId}`);
  return result;
}
export async function getAssessmentRevision(
  candidateId: string,
  revisionId: string,
) {
  return request<AssessmentRevision>(
    "get",
    `/api/recruitment/candidates/${candidateId}/assessment/revisions/${revisionId}`,
  );
}
