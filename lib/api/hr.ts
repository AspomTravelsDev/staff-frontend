"use server";

import { api, apiClient } from "./client";
import { revalidatePath } from "next/cache";
import type { OnboardingApplication, CreateApplicationRequest } from "@/lib/types/hr";

// ─── Authenticated endpoints (HR/Super admin) ───

export async function getApplications(): Promise<OnboardingApplication[]> {
    const response = await api.get<{ data: OnboardingApplication[] }>("/api/onboarding-applications");
    if (!response.success) throw new Error(response.error.error);
    return response.data.data;
}

export async function markOnboardingNotificationsViewed(): Promise<void> {
    const response = await api.post<{ message: string }>("/api/onboarding/notifications/mark-viewed");
    if (!response.success) throw new Error(response.error.error);
}

export async function getApplication(id: string): Promise<OnboardingApplication> {
    const response = await api.get<{ data: OnboardingApplication }>(`/api/onboarding-applications/${id}`);
    if (!response.success) throw new Error(response.error.error);
    return response.data.data;
}

export async function createApplication(data: CreateApplicationRequest): Promise<OnboardingApplication> {
    const response = await api.post<{ data: OnboardingApplication }>("/api/onboarding-applications", data);
    if (!response.success) throw new Error(response.error.error);
    revalidatePath("/hr/applications");
    return response.data.data;
}

export async function deleteApplication(id: string): Promise<void> {
    const response = await api.delete<{ message: string }>(`/api/onboarding-applications/${id}`);
    if (!response.success) throw new Error(response.error.error);
    revalidatePath("/hr/applications");
}

export async function sendInvite(id: string): Promise<void> {
    const response = await api.post<{ message: string }>(`/api/onboarding-applications/${id}/send-invite`);
    if (!response.success) throw new Error(response.error.error || "Failed to send invitation email");
}

export async function sendOnboardingReminder(
    id: string,
    payload: { note: string }
): Promise<void> {
    const response = await api.post<{ message: string }>(
        `/api/onboarding-applications/${id}/send-reminder`,
        payload,
    );
    if (!response.success) {
        throw new Error(response.error.error || "Failed to send reminder email");
    }
}

export type OnboardingCorrectionReason =
    | "unsigned_documents"
    | "missing_required_pages"
    | "missing_supporting_documents"
    | "invalid_document_quality"
    | "mismatched_information"
    | "other";

export async function requestOnboardingCorrection(
    id: string,
    payload: { reason: OnboardingCorrectionReason; note: string }
): Promise<void> {
    const response = await api.post<{ message: string }>(
        `/api/onboarding-applications/${id}/request-correction`,
        payload,
    );
    if (!response.success) {
        throw new Error(response.error.error || "Failed to request correction");
    }
}

// ─── Public endpoints (applicant portal — no auth) ───

export async function getPublicApplication(id: string): Promise<OnboardingApplication> {
    const response = await apiClient<{ data: OnboardingApplication }>(`/api/public/onboarding-applications/${id}`, {
        skipAuth: true,
    });
    if (!response.success) throw new Error(response.error.error);
    return response.data.data;
}

export async function savePublicFormStep(
    id: string,
    step: number,
    stepData: Record<string, unknown>
): Promise<OnboardingApplication> {
    const response = await apiClient<{ data: OnboardingApplication }>(`/api/public/onboarding-applications/${id}`, {
        method: "PUT",
        skipAuth: true,
        body: { step, step_data: stepData },
    });
    if (!response.success) throw new Error(response.error.error);
    return response.data.data;
}

export async function submitPublicApplication(
    id: string,
    stepData?: Record<string, unknown>
): Promise<OnboardingApplication> {
    const response = await apiClient<{ data: OnboardingApplication }>(
        `/api/public/onboarding-applications/${id}/submit`,
        {
            method: "POST",
            skipAuth: true,
            body: stepData ? { step_data: stepData } : undefined,
        }
    );
    if (!response.success) throw new Error(response.error.error);
    return response.data.data;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadPublicFile(
    id: string,
    file: File,
    fieldName: string
): Promise<{ fileName: string; storagePath: string; uploadedAt: string; fileId?: string }> {
    const formData = new FormData();
    formData.append("file", file, (file as any).name);
    formData.append("field_name", fieldName);

    const response = await fetch(`${API_URL}/api/public/onboarding-applications/${id}/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload file");
    }

    const result = await response.json();
    return result.data;
}
