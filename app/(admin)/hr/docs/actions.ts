"use server";

import { revalidatePath } from "next/cache";
import { uploadDocument, deleteDocument } from "@/lib/api/files";

export async function uploadDocumentAction(formData: FormData) {
    const result = await uploadDocument(formData);

    if (!result.success) {
        return { error: result.error?.error || "Failed to upload document" };
    }

    revalidatePath("/hr/docs");
    revalidatePath("/my/documents");
    return { success: true, data: result.data };
}

export async function deleteDocumentAction(fileId: string) {
    const result = await deleteDocument(fileId);

    if (!result.success) {
        return { error: result.error?.error || "Failed to delete document" };
    }

    revalidatePath("/hr/docs");
    revalidatePath("/my/documents");
    return { success: true };
}
