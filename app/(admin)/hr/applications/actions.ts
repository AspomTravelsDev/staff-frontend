"use server";

import { deleteApplication } from "@/lib/api/hr";
import { requestOnboardingCorrection } from "@/lib/api/hr";
import { sendOnboardingReminder } from "@/lib/api/hr";
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
    reason:
        | "unsigned_documents"
        | "missing_required_pages"
        | "invalid_document_quality"
        | "mismatched_information"
        | "other",
    note: string,
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
