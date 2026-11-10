/**
 * Supported MIME types and file extensions for employee documents.
 * Includes PDFs, Word documents, Excel spreadsheets, PowerPoint presentations,
 * text files, and common document image scans.
 */

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  // PDF
  "application/pdf",

  // Word (DOC, DOCX)
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Excel & Spreadsheets (XLS, XLSX, CSV)
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "application/csv",

  // PowerPoint (PPT, PPTX)
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",

  // Text & Rich Text
  "text/plain",
  "application/rtf",
  "text/rtf",

  // Common scanned image documents
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "ppt",
  "pptx",
  "txt",
  "rtf",
  "jpg",
  "jpeg",
  "png",
  "webp",
] as const;

export const DOCUMENT_ACCEPT_STRING =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.webp";

export function getFileExtension(filename: string | undefined): string {
  if (!filename || !filename.includes(".")) return "";
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Validates whether a file is an allowed document format, checking MIME type
 * and falling back to file extension (for browsers/OSs where MIME types might be generic).
 */
export function isAllowedDocumentFile(file: { name: string; type?: string }): boolean {
  if (file.type && (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return true;
  }
  const ext = getFileExtension(file.name);
  if (ext && (ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext)) {
    return true;
  }
  return false;
}
