const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadPublicFile(
    id: string,
    file: File,
    fieldName: string,
    maxRetries: number = 3
): Promise<{ fileName: string; storagePath: string; uploadedAt: string; fileId?: string }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const formData = new FormData();
            formData.append("file", file, (file as any).name);
            formData.append("field_name", fieldName);

            const response = await fetch(`${API_URL}/api/public/onboarding-applications/${id}/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (response.status === 413) {
                    throw new Error("File size exceeds server upload limit. Please compress the file and try again.");
                }
                throw new Error(errorData.message || `Upload failed with status code ${response.status}`);
            }

            const result = await response.json();
            return result.data;
        } catch (error: any) {
            lastError = error;
            const isNetworkError =
                error?.name === "TypeError" ||
                error?.message?.toLowerCase().includes("fetch") ||
                error?.message?.toLowerCase().includes("network");

            // If it's a network error and we have retries left, wait and retry
            if (isNetworkError && attempt < maxRetries) {
                await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
                continue;
            }

            if (isNetworkError) {
                throw new Error(
                    "Network connection error during upload. Please check your internet connection or try a smaller file."
                );
            }

            throw error;
        }
    }

    throw lastError || new Error("Failed to upload file after multiple attempts");
}
