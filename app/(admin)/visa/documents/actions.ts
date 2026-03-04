"use server";

import { revalidatePath } from "next/cache";
import { uploadDocument, deleteDocument, updateDocument } from "@/lib/api/files";

export async function uploadVisaDocumentAction(formData: FormData) {
    // Specifically set categorization fields
    formData.set("type", "visa");
    formData.set("category", "visa");
    formData.set("department", "Visa");

    const result = await uploadDocument(formData);
    // ... rest of the function remains same
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

export async function updateVisaDocumentAction(documentId: string, formData: FormData) {
    // Specifically set categorization fields
    formData.set("type", "visa");
    formData.set("category", "visa");
    formData.set("department", "Visa");

    const result = await updateDocument(documentId, formData);

    if (!result.success) {
        return { error: result.error?.error || "Failed to update document" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}
