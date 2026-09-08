"use server";

import { revalidatePath } from "next/cache";
import { uploadDocument, deleteDocument, updateDocument, createFolder, updateFolder, deleteFolder } from "@/lib/api/files";

export async function uploadVisaDocumentAction(formData: FormData) {
    // Specifically set categorization fields
    formData.set("type", "visa");
    formData.set("category", "visa");
    formData.set("department", "Visa");

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

export async function createVisaFolderAction(name: string, parentId?: string | null) {
    const result = await createFolder({
        name,
        parent_id: parentId || null,
        type: "visa",
        department: "Visa",
    });

    if (!result.success) {
        return { error: result.error?.error || "Failed to create folder" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}

export async function updateVisaFolderAction(folderId: string, name: string) {
    const result = await updateFolder(folderId, { name });

    if (!result.success) {
        return { error: result.error?.error || "Failed to rename folder" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}

export async function deleteVisaFolderAction(folderId: string) {
    const result = await deleteFolder(folderId);

    if (!result.success) {
        return { error: result.error?.error || "Failed to delete folder" };
    }

    revalidatePath("/visa/documents");
    return { success: true };
}

export async function moveVisaDocumentAction(documentId: string, folderId: string | null) {
    const formData = new FormData();
    formData.set("folder_id", folderId || "root");

    const result = await updateDocument(documentId, formData);

    if (!result.success) {
        return { error: result.error?.error || "Failed to move document" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}

export async function moveVisaFolderAction(folderId: string, targetParentId: string | null) {
    const result = await updateFolder(folderId, {
        parent_id: targetParentId || null,
    });

    if (!result.success) {
        return { error: result.error?.error || "Failed to move folder" };
    }

    revalidatePath("/visa/documents");
    return { success: true, data: result.data };
}
