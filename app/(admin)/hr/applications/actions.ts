"use server";

import { deleteApplication } from "@/lib/api/hr";
import { revalidatePath } from "next/cache";
import { downloadPdfFormsAction } from "@/app/(public)/applicant/[id]/pdf-actions";

export async function deleteApplicationAction(id: string) {
    await deleteApplication(id);
    revalidatePath("/hr/applications");
}

export async function generateDocumentsAction(uuid: string) {
    const result = await downloadPdfFormsAction(uuid);
    if (result.error) {
        throw new Error(result.error);
    }
    revalidatePath(`/hr/applications/${uuid}`);
    return result;
}
