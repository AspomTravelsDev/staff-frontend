"use server";

import { uploadDocument, deleteDocument } from "@/lib/api/files";
import { revalidatePath } from "next/cache";

export async function uploadOnboardingDocumentAction(formData: FormData) {
    // Specifically set the type to onboarding
    formData.set("type", "onboarding");
    if (!formData.has("department")) {
        formData.set("department", "HR");
    }

    const result = await uploadDocument(formData);

    if (!result.success) {
        return { error: result.error?.error || "Failed to upload document" };
    }

    revalidatePath("/(admin)/hr/onboarding", "page");
    return { success: true, data: result.data };
}

export async function deleteOnboardingDocumentAction(fileId: string) {
    const result = await deleteDocument(fileId);

    if (!result.success) {
        return { error: result.error?.error || "Failed to delete document" };
    }

    revalidatePath("/(admin)/hr/onboarding", "page");
    return { success: true };
}
