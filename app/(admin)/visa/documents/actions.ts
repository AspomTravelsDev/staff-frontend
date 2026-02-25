"use server";

import { revalidatePath } from "next/cache";
import { uploadDocument, deleteDocument } from "@/lib/api/files";

export async function uploadVisaDocumentAction(formData: FormData) {
    // Specifically set the category to visa
    formData.set("category", "visa");

    const result = await uploadDocument(formData);

    if (!result.success) {
        return { error: result.error?.error || "Failed to upload document" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}

export async function deleteVisaDocumentAction(fileId: string) {
    const result = await deleteDocument(fileId);

    if (!result.success) {
        return { error: result.error?.error || "Failed to delete document" };
    }

    revalidatePath("/visa/documents");
    return { success: true };
}
