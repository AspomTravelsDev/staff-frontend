"use server"

import type { VisaCountry } from "@/lib/visa/fields"
import type { VisaFormData } from "@/lib/stores/visa-form-store"

// Mock mode for development
const USE_MOCK = process.env.NEXT_PUBLIC_USE_REAL_API !== "true"

interface ActionResult {
    success: boolean
    error?: string
    data?: Record<string, unknown>
}

/**
 * Save draft progress to backend
 */
export async function saveDraft(
    applicationId: string,
    country: VisaCountry,
    currentStep: number,
    formData: Partial<VisaFormData>
): Promise<ActionResult> {
    if (USE_MOCK) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        console.log("Mock: Saving draft", { applicationId, country, currentStep, formData })
        return { success: true }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/draft`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    country,
                    current_step: currentStep,
                    data: formData,
                }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to save draft" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error saving draft:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}

/**
 * Upload a document file
 */
export async function uploadDocument(
    applicationId: string,
    fieldName: string,
    formData: FormData
): Promise<ActionResult & { file?: { id: string; name: string; size: number; type: string; url: string } }> {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const file = formData.get("file") as File
        return {
            success: true,
            file: {
                id: crypto.randomUUID(),
                name: file?.name || "document.pdf",
                size: file?.size || 0,
                type: file?.type || "application/pdf",
                url: "/mock-file-url",
            },
        }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/documents/${fieldName}`,
            {
                method: "POST",
                body: formData,
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to upload document" }
        }

        const result = await response.json()
        return { success: true, file: result.data }
    } catch (error) {
        console.error("Error uploading document:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}

/**
 * Delete an uploaded document
 */
export async function deleteDocument(
    applicationId: string,
    fieldName: string,
    fileId: string
): Promise<ActionResult> {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { success: true }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/documents/${fieldName}/${fileId}`,
            {
                method: "DELETE",
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to delete document" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error deleting document:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}

/**
 * Submit the completed application
 */
export async function submitApplication(
    applicationId: string,
    country: VisaCountry,
    formData: VisaFormData
): Promise<ActionResult> {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        console.log("Mock: Submitting application", { applicationId, country, formData })
        return { success: true }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/submit`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    country,
                    data: formData,
                }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to submit application" }
        }

        return { success: true }
    } catch (error) {
        console.error("Error submitting application:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}
