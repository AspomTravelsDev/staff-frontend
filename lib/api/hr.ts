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

export async function toggleAddressVerification(
    id: string,
    verified?: boolean
): Promise<OnboardingApplication> {
    const response = await api.patch<{ message: string; data: OnboardingApplication }>(
        `/api/onboarding-applications/${id}/verify-address`,
        verified !== undefined ? { verified } : {}
    );
    if (!response.success) {
        throw new Error(response.error.error || "Failed to update address verification");
    }
    return response.data.data;
}

export interface ProvisionCorporateEmailRequest {
    email_username?: string;
    password?: string;
    send_portal_invite?: boolean;
    send_credentials_email?: boolean;
    role?: string;
    department?: string;
    staff_id?: string;
    date_joined?: string;
    is_supervisor?: boolean;
    is_department_account?: boolean;
}

export interface ProvisionCorporateEmailResponse {
    application: OnboardingApplication;
    corporate_email: string;
    temporary_password: string;
    portal_invite_sent: boolean;
    credentials_email_sent: boolean;
    invite_url?: string;
}

export async function provisionCorporateEmail(
    id: string,
    payload?: ProvisionCorporateEmailRequest
): Promise<ProvisionCorporateEmailResponse> {
    const response = await api.post<{
        message: string;
        data: ProvisionCorporateEmailResponse;
    }>(`/api/onboarding-applications/${id}/provision-email`, payload || {});

    if (!response.success) {
        throw new Error(response.error.error || "Failed to provision corporate email");
    }

    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    revalidatePath("/it/onboarding");
    return response.data.data;
}

export interface ResendOnboardingEmailsRequest {
    send_portal_invite?: boolean;
    send_credentials_email?: boolean;
    password?: string;
    role?: string;
    department?: string;
}

export interface ResendOnboardingEmailsResponse {
    message: string;
    invite_url?: string;
    cpanel_check?: {
        exists: boolean;
        configured: boolean;
        email?: string;
        auto_created?: boolean;
    };
    portal_invite_sent?: boolean;
    credentials_email_sent?: boolean;
}

export async function resendPortalInvite(
    id: string,
    payload?: ResendOnboardingEmailsRequest
): Promise<ResendOnboardingEmailsResponse> {
    const response = await api.post<ResendOnboardingEmailsResponse>(
        `/api/onboarding-applications/${id}/resend-portal-invite`,
        payload || {}
    );

    if (!response.success) {
        throw new Error(response.error.error || "Failed to resend onboarding emails");
    }

    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    revalidatePath("/it/onboarding");
    return response.data;
}

export async function checkCpanelEmail(
    id: string
): Promise<{
    corporate_email: string;
    cpanel_check: {
        exists: boolean;
        configured: boolean;
        email?: string;
        account?: any;
        error?: string;
    };
    provisioned_at?: string;
}> {
    const response = await api.get<{
        corporate_email: string;
        cpanel_check: {
            exists: boolean;
            configured: boolean;
            email?: string;
            account?: any;
            error?: string;
        };
        provisioned_at?: string;
    }>(`/api/onboarding-applications/${id}/check-cpanel-email`);

    if (!response.success) {
        throw new Error(response.error.error || "Failed to check cPanel email status");
    }

    return response.data;
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


