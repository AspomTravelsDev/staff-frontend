"use server";

import { revalidatePath } from "next/cache";
import { createFolder, deleteDocument, deleteFolder, updateDocument, updateFolder, uploadDocument } from "./files";

type DocumentScope = "hr" | "visa";

function scopeValues(scope: DocumentScope): { type: string; category?: string; department?: string; path: string } {
  return scope === "visa"
    ? { type: "visa", category: "visa", department: "Visa", path: "/visa/documents" }
    : { type: "hr", path: "/hr/docs" };
}

export async function uploadScopedDocumentAction(scope: DocumentScope, formData: FormData) {
  const values = scopeValues(scope);
  formData.set("type", values.type);
  if (scope === "visa") {
    formData.set("category", values.category ?? "visa");
    formData.set("department", values.department ?? "Visa");
  }
  const result = await uploadDocument(formData);
  if (!result.success) return { error: result.error?.error || "Failed to upload document" };
  revalidatePath(values.path, "page");
  return { success: true, data: result.data };
}

export async function uploadScopedDocumentsAction(scope: DocumentScope, formDataList: FormData[]) {
  const results = await Promise.all(
    formDataList.map((formData) => uploadScopedDocumentAction(scope, formData)),
  );
  const failures = results.filter((result) => result.error).map((result) => result.error);
  if (failures.length > 0) {
    return {
      error: `${failures.length} file${failures.length === 1 ? "" : "s"} failed to upload.`,
      uploadedCount: results.length - failures.length,
    };
  }
  return { success: true, uploadedCount: results.length };
}

export async function updateScopedDocumentAction(scope: DocumentScope, documentId: string, formData: FormData) {
  const values = scopeValues(scope);
  formData.set("type", values.type);
  if (scope === "visa") {
    formData.set("category", values.category ?? "visa");
    formData.set("department", values.department ?? "Visa");
  }
  const result = await updateDocument(documentId, formData);
  if (!result.success) return { error: result.error?.error || "Failed to update document" };
  revalidatePath(values.path, "page");
  return { success: true, data: result.data };
}

export async function deleteScopedDocumentAction(scope: DocumentScope, fileId: string) {
  const result = await deleteDocument(fileId);
  if (!result.success) return { error: result.error?.error || "Failed to delete document" };
  revalidatePath(scopeValues(scope).path, "page");
  return { success: true };
}

export async function deleteScopedDocumentsAction(scope: DocumentScope, fileIds: string[]) {
  const results = await Promise.all(
    fileIds.map((fileId) => deleteScopedDocumentAction(scope, fileId)),
  );
  const failures = results.filter((result) => result.error);
  if (failures.length > 0) {
    return {
      error: `${failures.length} file${failures.length === 1 ? "" : "s"} failed to delete.`,
      deletedCount: results.length - failures.length,
    };
  }
  return { success: true, deletedCount: results.length };
}

export async function createScopedFolderAction(scope: DocumentScope, name: string, parentId?: string | null) {
  const values = scopeValues(scope);
  const result = await createFolder({
    name,
    parent_id: parentId || null,
    type: values.type,
    department: scope === "visa" ? values.department ?? "Visa" : "HR",
  });
  if (!result.success) return { error: result.error?.error || "Failed to create folder" };
  revalidatePath(values.path, "page");
  return { success: true, data: result.data };
}

export async function updateScopedFolderAction(scope: DocumentScope, folderId: string, data: { name?: string; parent_id?: string | null }) {
  const result = await updateFolder(folderId, data);
  if (!result.success) return { error: result.error?.error || "Failed to update folder" };
  revalidatePath(scopeValues(scope).path, "page");
  return { success: true, data: result.data };
}

export async function deleteScopedFolderAction(scope: DocumentScope, folderId: string) {
  const result = await deleteFolder(folderId);
  if (!result.success) return { error: result.error?.error || "Failed to delete folder" };
  revalidatePath(scopeValues(scope).path, "page");
  return { success: true };
}

export async function moveScopedDocumentAction(scope: DocumentScope, documentId: string, folderId: string | null) {
  const formData = new FormData();
  formData.set("folder_id", folderId || "root");
  const result = await updateDocument(documentId, formData);
  if (!result.success) return { error: result.error?.error || "Failed to move document" };
  revalidatePath(scopeValues(scope).path, "page");
  return { success: true, data: result.data };
}

export async function moveScopedDocumentsAction(scope: DocumentScope, documentIds: string[], folderId: string | null) {
  const results = await Promise.all(
    documentIds.map((documentId) => moveScopedDocumentAction(scope, documentId, folderId)),
  );
  const failure = results.find((result) => result.error);
  if (failure?.error) return { error: failure.error };
  return { success: true };
}

export async function moveScopedFolderAction(scope: DocumentScope, folderId: string, targetParentId: string | null) {
  return updateScopedFolderAction(scope, folderId, { parent_id: targetParentId || null });
}
