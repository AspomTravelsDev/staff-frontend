import { getAuthToken } from "@/lib/auth/session"
import type { VisaCountry } from "@/lib/visa/fields"
import type { VisaFormData } from "@/lib/stores/visa-form-store"

const USE_MOCK = process.env.NODE_ENV === "development"

export interface ApplicationListItem {
    id: string
    country: VisaCountry
    status: "draft" | "submitted" | "processing" | "approved" | "rejected"
    applicant_name?: string
    applicant_email?: string
    created_at: string
    updated_at: string
    submitted_at?: string
}

export interface ApplicationDetail extends ApplicationListItem {
    data: VisaFormData
    current_step: number
    admin_notes?: string
}

interface GetApplicationsParams {
    status?: string
    country?: string
    page?: number
    limit?: number
}

interface ApplicationsResponse {
    data: ApplicationListItem[]
    totalPages: number
    currentPage: number
    total: number
}

// Mock data for development
const mockApplications: ApplicationListItem[] = [
    {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        country: "canada",
        status: "submitted",
        applicant_name: "John Doe",
        applicant_email: "john.doe@example.com",
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-18T14:30:00Z",
        submitted_at: "2025-01-18T14:30:00Z",
    },
    {
        id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
        country: "uk",
        status: "draft",
        applicant_name: "Jane Smith",
        applicant_email: "jane.smith@example.com",
        created_at: "2025-01-16T09:00:00Z",
        updated_at: "2025-01-17T11:00:00Z",
    },
    {
        id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
        country: "schengen",
        status: "processing",
        applicant_name: "Bob Wilson",
        applicant_email: "bob.wilson@example.com",
        created_at: "2025-01-10T08:00:00Z",
        updated_at: "2025-01-19T16:00:00Z",
        submitted_at: "2025-01-14T10:00:00Z",
    },
    {
        id: "d4e5f6a7-b8c9-0123-def0-456789012345",
        country: "canada",
        status: "approved",
        applicant_name: "Alice Johnson",
        applicant_email: "alice.j@example.com",
        created_at: "2025-01-05T12:00:00Z",
        updated_at: "2025-01-20T09:00:00Z",
        submitted_at: "2025-01-08T15:00:00Z",
    },
    {
        id: "e5f6a7b8-c9d0-1234-ef01-567890123456",
        country: "uk",
        status: "rejected",
        applicant_name: "Charlie Brown",
        applicant_email: "charlie.b@example.com",
        created_at: "2025-01-01T10:00:00Z",
        updated_at: "2025-01-15T11:00:00Z",
        submitted_at: "2025-01-05T14:00:00Z",
    },
]

// Mock full application data for details view
const mockFullApplications: Record<string, ApplicationDetail> = {
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890": {
        ...mockApplications[0],
        data: {
            given_names: "John",
            surname: "Doe",
            email_address: "john.doe@example.com",
            // Add more mock data as needed
        },
        current_step: 7,
    },
    // Add more as needed
}

/**
 * Fetch paginated list of applications
 */
export async function getApplications(
    params: GetApplicationsParams = {}
): Promise<ApplicationsResponse> {
    const { status, country, page = 1, limit = 10 } = params

    if (USE_MOCK) {
        // Filter mock data
        let filtered = [...mockApplications]

        if (status) {
            filtered = filtered.filter((a) => a.status === status)
        }
        if (country) {
            filtered = filtered.filter((a) => a.country === country)
        }

        // Paginate
        const start = (page - 1) * limit
        const end = start + limit
        const data = filtered.slice(start, end)

        return {
            data,
            totalPages: Math.ceil(filtered.length / limit),
            currentPage: page,
            total: filtered.length,
        }
    }

    try {
        const token = await getAuthToken()
        const queryParams = new URLSearchParams()

        if (status) queryParams.set("status", status)
        if (country) queryParams.set("country", country)
        queryParams.set("page", String(page))
        queryParams.set("limit", String(limit))

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications?${queryParams}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            }
        )

        if (!response.ok) {
            throw new Error("Failed to fetch applications")
        }

        const result = await response.json()

        return {
            data: result.data,
            totalPages: result.meta.total_pages,
            currentPage: result.meta.current_page,
            total: result.meta.total,
        }
    } catch (error) {
        console.error("Error fetching applications:", error)
        return {
            data: [],
            totalPages: 0,
            currentPage: 1,
            total: 0,
        }
    }
}

/**
 * Fetch a single application with full details
 */
export async function getApplicationDetail(
    applicationId: string
): Promise<ApplicationDetail | null> {
    if (USE_MOCK) {
        const app = mockApplications.find((a) => a.id === applicationId)
        if (!app) return null

        return {
            ...app,
            data: {
                given_names: "John",
                surname: "Doe",
                email_address: app.applicant_email,
                dob: "1990-05-15",
                gender: "male",
                current_nationality: "Nigerian",
            },
            current_step: app.status === "draft" ? 3 : 7,
        }
    }

    try {
        const token = await getAuthToken()

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/visa-applications/${applicationId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
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
