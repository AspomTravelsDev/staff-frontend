"use server";

import { runAction } from "@/lib/api/run-action";
import { ExpectedActionError } from "@/lib/api/action-result";

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
    return runAction(async () => {
        await deleteApplication(id);
        revalidatePath("/hr/applications");
    }, "deleteApplicationAction");
}

export async function generateDocumentsAction(uuid: string) {
    return runAction(async () => {
        const result = await downloadPdfFormsAction(uuid, { includeAdminOnly: true });
        if (result.error) {
            throw new ExpectedActionError(result.error);
        }
        revalidatePath(`/hr/applications/${uuid}`);
        return result;
    }, "generateDocumentsAction");
}

export async function requestCorrectionAction(
    id: string,
    reason: OnboardingCorrectionReason,
    note: string
) {
    return runAction(async () => {
        await requestOnboardingCorrection(id, { reason, note });
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
    }, "requestCorrectionAction");
}

export async function sendReminderAction(id: string, note: string) {
    return runAction(async () => {
        await sendOnboardingReminder(id, { note });
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
    }, "sendReminderAction");
}

export async function toggleAddressVerificationAction(id: string, verified?: boolean) {
    return runAction(async () => {
        const updated = await toggleAddressVerification(id, verified);
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        return updated;
    }, "toggleAddressVerificationAction");
}

export async function updateContactVerificationAction(
    id: string,
    payload: {
        contact: "guarantor" | "referee";
        index?: number;
        status: ContactVerificationStatus;
    },
) {
    return runAction(async () => {
        const updated = await updateContactVerification(id, payload);
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        return updated;
    }, "updateContactVerificationAction");
}

export async function provisionCorporateEmailAction(id: string, payload?: ProvisionCorporateEmailRequest) {
    return runAction(async () => {
        const result = await provisionCorporateEmail(id, payload);
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        revalidatePath("/it/onboarding");
        return result;
    }, "provisionCorporateEmailAction");
}

export async function resendPortalInviteAction(id: string, payload?: ResendOnboardingEmailsRequest) {
    return runAction(async () => {
        const result = await resendPortalInvite(id, payload);
        revalidatePath(`/hr/applications/${id}`);
        revalidatePath("/hr/applications");
        revalidatePath("/it/onboarding");
        return result;
    }, "resendPortalInviteAction");
}

export async function checkCpanelEmailAction(id: string) {
    return runAction(async () => {
        return await checkCpanelEmail(id);
    }, "checkCpanelEmailAction");
}
