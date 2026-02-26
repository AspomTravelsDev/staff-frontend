"use server";

import { uploadDocument } from "@/lib/api/files";
import { revalidatePath } from "next/cache";

export async function uploadDocumentAction(formData: FormData) {
    const result = await uploadDocument(formData);

    if (result.success) {
        revalidatePath("/hr/onboarding");
        return { success: true, data: result.data };
    }

    return { success: false, error: result.error?.error || "Upload failed" };
}
