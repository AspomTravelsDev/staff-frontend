"use server"

import { revalidatePath } from "next/cache"
import { getAuthToken } from "@/lib/auth/session"
import type { VisaCountry } from "@/lib/visa/fields"
import type { VisaFormData } from "@/lib/stores/visa-form-store"

const USE_MOCK = process.env.NEXT_PUBLIC_USE_REAL_API !== "true"

interface ActionResult {
    success: boolean
    error?: string
    data?: {
        id: string
        publicUrl: string
    }
}

/**
 * Create a new visa application with optional pre-fill data
 */
export async function createApplication(
    applicationId: string,
    country: VisaCountry,
    prefillData?: Partial<VisaFormData>
): Promise<ActionResult> {
    if (USE_MOCK) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const publicUrl = `${baseUrl}/visa/apply/${country}/${applicationId}`

        console.log("Mock: Creating application", { applicationId, country, prefillData })

        return {
            success: true,
            data: {
                id: applicationId,
                publicUrl,
            },
        }
    }

    try {
        const token = await getAuthToken()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id: applicationId,
                    country,
                    prefill_data: prefillData,
                    status: "draft",
                }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to create application" }
        }

        const result = await response.json()

        revalidatePath("/visa/applications")

        return {
            success: true,
            data: {
                id: result.data.id,
                publicUrl: result.data.public_url,
            },
        }
    } catch (error) {
        console.error("Error creating application:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}

/**
 * Delete a visa application
 */
export async function deleteApplication(applicationId: string): Promise<ActionResult> {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return { success: true }
    }

    try {
        const token = await getAuthToken()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to delete application" }
        }

        revalidatePath("/visa/applications")

        return { success: true }
    } catch (error) {
        console.error("Error deleting application:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}

/**
 * Update application status (admin only)
 */
export async function updateApplicationStatus(
    applicationId: string,
    status: "draft" | "submitted" | "processing" | "approved" | "rejected",
    notes?: string
): Promise<ActionResult> {
    if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 300))
        console.log("Mock: Updating status", { applicationId, status, notes })
        return { success: true }
    }

    try {
        const token = await getAuthToken()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status, notes }),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            return { success: false, error: error.message || "Failed to update status" }
        }

        revalidatePath(`/visa/applications/${applicationId}`)
        revalidatePath("/visa/applications")

        return { success: true }
    } catch (error) {
        console.error("Error updating status:", error)
        return { success: false, error: "Network error. Please try again." }
    }
}
