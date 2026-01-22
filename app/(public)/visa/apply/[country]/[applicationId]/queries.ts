import type { VisaCountry } from "@/lib/visa/fields"
import type { VisaFormData } from "@/lib/stores/visa-form-store"

// Mock data for development - replace with actual API calls
const USE_MOCK = process.env.NODE_ENV === "development"

interface ApplicationResponse {
    id: string
    country: VisaCountry
    status: "draft" | "submitted" | "processing" | "approved" | "rejected"
    current_step: number
    data: Partial<VisaFormData>
    created_at: string
    updated_at: string
}

/**
 * Fetch application data from backend
 */
export async function getApplication(
    applicationId: string,
    country: VisaCountry
): Promise<ApplicationResponse | null> {
    if (USE_MOCK) {
        // Return mock data for development
        return {
            id: applicationId,
            country,
            status: "draft",
            current_step: 1,
            data: {
                // Example pre-filled data from admin
                // given_names: "John",
                // surname: "Doe",
                // email_address: "john.doe@example.com",
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        )

        if (!response.ok) {
            if (response.status === 404) {
                return null
            }
            throw new Error("Failed to fetch application")
        }

        const result = await response.json()
        return result.data
    } catch (error) {
        console.error("Error fetching application:", error)
        return null
    }
}

/**
 * Fetch application status
 */
export async function getApplicationStatus(
    applicationId: string
): Promise<{ status: string; updated_at: string } | null> {
    if (USE_MOCK) {
        return {
            status: "draft",
            updated_at: new Date().toISOString(),
        }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}/status`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            }
        )

        if (!response.ok) {
            return null
        }

        return await response.json()
    } catch (error) {
        console.error("Error fetching application status:", error)
        return null
    }
}
