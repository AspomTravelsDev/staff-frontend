"use server";

import { runAction } from "./run-action";
import { ExpectedActionError, type ActionResult } from "./action-result";

import { api, apiClient } from "./client";
import { revalidatePath } from "next/cache";
import type { OnboardingApplication, CreateApplicationRequest } from "@/lib/types/hr";
import type { ContactVerificationStatus } from "@/lib/types/form-data";

// ─── Authenticated endpoints (HR/Super admin) ───

export async function getApplications(): Promise<ActionResult<OnboardingApplication[]>> {
    return runAction(async (): Promise<OnboardingApplication[]> => {
        const response = await api.get<{ data: OnboardingApplication[] }>("/api/onboarding-applications");
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        return response.data.data;
    }, "getApplications");
}

export async function markOnboardingNotificationsViewed(): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const response = await api.post<{ message: string }>("/api/onboarding/notifications/mark-viewed");
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
    }, "markOnboardingNotificationsViewed");
}

export async function getApplication(id: string): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await api.get<{ data: OnboardingApplication }>(`/api/onboarding-applications/${id}`);
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        return response.data.data;
    }, "getApplication");
}

export async function createApplication(data: CreateApplicationRequest): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await api.post<{ data: OnboardingApplication }>("/api/onboarding-applications", data);
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        revalidatePath("/hr/applications");
        return response.data.data;
    }, "createApplication");
}

export async function deleteApplication(id: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const response = await api.delete<{ message: string }>(`/api/onboarding-applications/${id}`);
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        revalidatePath("/hr/applications");
    }, "deleteApplication");
}

export async function sendInvite(id: string): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const response = await api.post<{ message: string }>(`/api/onboarding-applications/${id}/send-invite`);
        if (!response.success) throw new ExpectedActionError(response.error.error || "Failed to send invitation email", response.error.code);
    }, "sendInvite");
}

export async function sendOnboardingReminder(
    id: string,
    payload: { note: string }
): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const response = await api.post<{ message: string }>(
            `/api/onboarding-applications/${id}/send-reminder`,
            payload,
        );
        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to send reminder email", response.error.code);
        }
    }, "sendOnboardingReminder");
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
): Promise<ActionResult<void>> {
    return runAction(async (): Promise<void> => {
        const response = await api.post<{ message: string }>(
            `/api/onboarding-applications/${id}/request-correction`,
            payload,
        );
        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to request correction", response.error.code);
        }
    }, "requestOnboardingCorrection");
}

export async function toggleAddressVerification(
    id: string,
    verified?: boolean
): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await api.patch<{ message: string; data: OnboardingApplication }>(
            `/api/onboarding-applications/${id}/verify-address`,
            verified !== undefined ? { verified } : {}
        );
        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to update address verification", response.error.code);
        }
        return response.data.data;
    }, "toggleAddressVerification");
}

export async function updateContactVerification(
    id: string,
    payload: {
        contact: "guarantor" | "referee";
        index?: number;
        status: ContactVerificationStatus;
    },
): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await api.patch<{ message: string; data: OnboardingApplication }>(
            `/api/onboarding-applications/${id}/verify-contact`,
            payload,
        );
        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to update contact verification", response.error.code);
        }
        return response.data.data;
    }, "updateContactVerification");
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
): Promise<ActionResult<ProvisionCorporateEmailResponse>> {
    return runAction(async (): Promise<ProvisionCorporateEmailResponse> => {
        const response = await api.post<{
            message: string;
            data: ProvisionCorporateEmailResponse;
        }>(`/api/onboarding-applications/${id}/provision-email`, payload || {});

        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to provision corporate email", response.error.code);
        }

        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        revalidatePath("/it/onboarding");
        return response.data.data;
    }, "provisionCorporateEmail");
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
): Promise<ActionResult<ResendOnboardingEmailsResponse>> {
    return runAction(async (): Promise<ResendOnboardingEmailsResponse> => {
        const response = await api.post<ResendOnboardingEmailsResponse>(
            `/api/onboarding-applications/${id}/resend-portal-invite`,
            payload || {}
        );

        if (!response.success) {
            throw new ExpectedActionError(response.error.error || "Failed to resend onboarding emails", response.error.code);
        }

        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        revalidatePath("/it/onboarding");
        return response.data;
    }, "resendPortalInvite");
}

export async function checkCpanelEmail(
    id: string
): Promise<ActionResult<{
    corporate_email: string;
    cpanel_check: {
        exists: boolean;
        configured: boolean;
        email?: string;
        account?: any;
        error?: string;
    };
    provisioned_at?: string;
}>> {
    return runAction(async (): Promise<{
    corporate_email: string;
    cpanel_check: {
        exists: boolean;
        configured: boolean;
        email?: string;
        account?: any;
        error?: string;
    };
    provisioned_at?: string;
}> => {
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
            throw new ExpectedActionError(response.error.error || "Failed to check cPanel email status", response.error.code);
        }

        return response.data;
    }, "checkCpanelEmail");
}

// ─── Public endpoints (applicant portal — no auth) ───

export async function getPublicApplication(id: string): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await apiClient<{ data: OnboardingApplication }>(`/api/public/onboarding-applications/${id}`, {
            skipAuth: true,
        });
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        return response.data.data;
    }, "getPublicApplication");
}

export async function savePublicFormStep(
    id: string,
    step: number,
    stepData: Record<string, unknown>
): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await apiClient<{ data: OnboardingApplication }>(`/api/public/onboarding-applications/${id}`, {
            method: "PUT",
            skipAuth: true,
            body: { step, step_data: stepData },
        });
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        return response.data.data;
    }, "savePublicFormStep");
}

export async function submitPublicApplication(
    id: string,
    stepData?: Record<string, unknown>
): Promise<ActionResult<OnboardingApplication>> {
    return runAction(async (): Promise<OnboardingApplication> => {
        const response = await apiClient<{ data: OnboardingApplication }>(
            `/api/public/onboarding-applications/${id}/submit`,
            {
                method: "POST",
                skipAuth: true,
                body: stepData ? { step_data: stepData } : undefined,
            }
        );
        if (!response.success) throw new ExpectedActionError(response.error.error, response.error.code);
        return response.data.data;
    }, "submitPublicApplication");
}


