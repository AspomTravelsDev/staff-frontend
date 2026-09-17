"use server";

import { deleteApplication } from "@/lib/api/hr";
import { requestOnboardingCorrection, type OnboardingCorrectionReason } from "@/lib/api/hr";
import { sendOnboardingReminder } from "@/lib/api/hr";
import { toggleAddressVerification, updateContactVerification } from "@/lib/api/hr";
import type { ContactVerificationStatus } from "@/lib/types/form-data";
import {
    provisionCorporateEmail,
    resendPortalInvite,
    checkCpanelEmail,
    type ProvisionCorporateEmailRequest,
    type ResendOnboardingEmailsRequest
} from "@/lib/api/hr";
import { revalidatePath } from "next/cache";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";

export async function deleteApplicationAction(id: string) {
    await deleteApplication(id);
    revalidatePath("/hr/applications");
}

export async function generateDocumentsAction(uuid: string) {
    const result = await downloadPdfFormsAction(uuid, { includeAdminOnly: true });
    if (result.error) {
        throw new Error(result.error);
    }
    revalidatePath(`/hr/applications/${uuid}`);
    return result;
}

export async function requestCorrectionAction(
    id: string,
    reason: OnboardingCorrectionReason,
    note: string
) {
    await requestOnboardingCorrection(id, { reason, note });
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
}

export async function sendReminderAction(id: string, note: string) {
    await sendOnboardingReminder(id, { note });
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
}

export async function toggleAddressVerificationAction(id: string, verified?: boolean) {
    const updated = await toggleAddressVerification(id, verified);
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    return updated;
}

export async function updateContactVerificationAction(
    id: string,
    payload: {
        contact: "guarantor" | "referee";
        index?: number;
        status: ContactVerificationStatus;
    },
) {
    const updated = await updateContactVerification(id, payload);
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    return updated;
}

export async function provisionCorporateEmailAction(id: string, payload?: ProvisionCorporateEmailRequest) {
    const result = await provisionCorporateEmail(id, payload);
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    revalidatePath("/it/onboarding");
    return result;
}

export async function resendPortalInviteAction(id: string, payload?: ResendOnboardingEmailsRequest) {
    const result = await resendPortalInvite(id, payload);
    revalidatePath(`/hr/applications/${id}`);
    revalidatePath("/hr/applications");
    revalidatePath("/it/onboarding");
    return result;
}

export async function checkCpanelEmailAction(id: string) {
    return await checkCpanelEmail(id);
}
