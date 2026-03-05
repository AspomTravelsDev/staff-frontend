import { getAllDocuments } from "@/lib/api/files";
import { DocumentFile } from "@/types/file-types";

export async function getDocuments(): Promise<DocumentFile[]> {
    const [hrResult, onboardingResult] = await Promise.all([
        getAllDocuments({ type: "hr" }),
        getAllDocuments({ type: "onboarding" })
    ]);

    if (!hrResult.success || !onboardingResult.success) {
        throw new Error("Failed to fetch documents");
    }

    return [...hrResult.data, ...onboardingResult.data];
}
