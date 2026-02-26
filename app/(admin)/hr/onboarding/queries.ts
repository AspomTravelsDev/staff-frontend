import { getAllDocuments } from "@/lib/api/files";
import { DocumentFile } from "@/types/file-types";

export async function getDocuments(): Promise<DocumentFile[]> {
    const result = await getAllDocuments({ category: "general,nysc,other" });
    if (!result.success) {
        throw new Error(result.error?.error || "Failed to fetch documents");
    }
    return result.data;
}
