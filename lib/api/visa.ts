/**
 * Visa API Module
 *
 * API functions for visa applications management.
 * Used by React Query hooks and Server Actions.
 */

import { api, shouldMock } from "./client";
import {
    getMockApplications,
    getMockApplicationById,
    getMockApplicationNotes,
    getMockApplicationDocuments,
    getMockApplicationAuditLog,
    getMockVisaStaff,
    toListItem,
} from "./mock-loader";
import type {
    PaginatedResponse,
    AuditLogEntry,
    DocumentAttachment,
    InternalNote,
} from "./types";
import type { VisaFormData } from "@/lib/stores/visa-form-store";

// ============================================================================
// Types
// ============================================================================

export type VisaCountry = "canada" | "uk" | "schengen";

export type VisaApplicationStatus =
    | "draft"
    | "submitted"
    | "documents_pending"
    | "under_review"
    | "embassy_submitted"
    | "appointment_scheduled"
    | "approved"
    | "rejected"
    | "escalated"
    | "collected";

export type VisaPriority = "normal" | "urgent" | "express";

export type PaymentStatus = "pending" | "partial" | "paid" | "refunded";

/**
 * Visa application entity
 */
export interface VisaApplication {
    id: string;
    reference_number: string;
    country: VisaCountry;

    // Applicant summary (extracted from form data)
    applicant_name: string;
    applicant_email: string;
    applicant_phone?: string;
    passport_number: string;
    passport_expiry: string;
    nationality: string;

    // Full form data
    data: VisaFormData;
    current_step: number;

    // Processing
    status: VisaApplicationStatus;
    priority: VisaPriority;
    assigned_to: string | null;
    assigned_to_name?: string;
    assigned_at: string | null;

    // Financial
    fee_amount: number;
    fee_currency: string;
    payment_status: PaymentStatus;
    payment_reference: string | null;

    // Embassy/Appointment
    embassy_reference: string | null;
    appointment_date: string | null;
    appointment_location: string | null;

    // Audit fields
    created_by: string;
    created_by_name: string;
    created_at: string;
    updated_by: string;
    updated_by_name: string;
    updated_at: string;
    submitted_at: string | null;
    completed_at: string | null;

    // Counts for UI
    notes_count: number;
    documents_count: number;
}

/**
 * List item (lighter than full application)
 */
export interface VisaApplicationListItem {
    id: string;
    reference_number: string;
    country: VisaCountry;
    applicant_name: string;
    applicant_email: string;
    passport_number: string;
    status: VisaApplicationStatus;
    priority: VisaPriority;
    assigned_to_name?: string;
    payment_status: PaymentStatus;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
}

/**
 * Filter parameters for listing applications
 */
export interface VisaApplicationFilters {
    page?: number;
    limit?: number;
    status?: VisaApplicationStatus;
    country?: VisaCountry;
    priority?: VisaPriority;
    assigned_to?: string;
    payment_status?: PaymentStatus;
    search?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface UpdateStatusRequest {
    status: VisaApplicationStatus;
    note?: string;
}

export interface AssignApplicationRequest {
    staff_id: string;
    note?: string;
}

export interface AddNoteRequest {
    content: string;
    is_internal: boolean;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated list of visa applications
 */
export async function getVisaApplications(
    filters: VisaApplicationFilters = {}
): Promise<PaginatedResponse<VisaApplicationListItem>> {
    if (shouldMock("useMockVisa")) {
        const applications = await getMockApplications();
        let filtered = applications.map(toListItem);

        if (filters.status) {
            filtered = filtered.filter((app) => app.status === filters.status);
        }
        if (filters.country) {
            filtered = filtered.filter((app) => app.country === filters.country);
        }
        if (filters.priority) {
            filtered = filtered.filter((app) => app.priority === filters.priority);
        }
        if (filters.payment_status) {
            filtered = filtered.filter(
                (app) => app.payment_status === filters.payment_status
            );
        }
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (app) =>
                    app.applicant_name.toLowerCase().includes(search) ||
                    app.applicant_email.toLowerCase().includes(search) ||
                    app.reference_number.toLowerCase().includes(search) ||
                    app.passport_number.toLowerCase().includes(search)
            );
        }

        // Sort
        const sortBy = filters.sort_by || "created_at";
        const sortOrder = filters.sort_order || "desc";
        filtered.sort((a, b) => {
            const aVal = a[sortBy as keyof VisaApplicationListItem] || "";
            const bVal = b[sortBy as keyof VisaApplicationListItem] || "";
            const comparison = String(aVal).localeCompare(String(bVal));
            return sortOrder === "desc" ? -comparison : comparison;
        });

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        return {
            items: filtered.slice((page - 1) * limit, page * limit),
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    // Build query string
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const result = await api.get<PaginatedResponse<VisaApplicationListItem>>(
        `/visa-applications?${params.toString()}`
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get single visa application by ID
 */
export async function getVisaApplication(id: string): Promise<VisaApplication> {
    if (shouldMock("useMockVisa")) {
        const application = await getMockApplicationById(id);
        if (!application) {
            throw new Error("Application not found");
        }
        return application;
    }

    const result = await api.get<VisaApplication>(`/visa-applications/${id}`);

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
    id: string,
    data: UpdateStatusRequest
): Promise<VisaApplication> {
    if (shouldMock("useMockVisa")) {
        const application = await getMockApplicationById(id);
        if (!application) {
            throw new Error("Application not found");
        }
        return {
            ...application,
            status: data.status,
            updated_at: new Date().toISOString(),
        };
    }

    const result = await api.patch<VisaApplication>(
        `/visa-applications/${id}/status`,
        data
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Assign application to staff member
 */
export async function assignApplication(
    id: string,
    data: AssignApplicationRequest
): Promise<VisaApplication> {
    if (shouldMock("useMockVisa")) {
        const application = await getMockApplicationById(id);
        const staff = await getMockVisaStaff();
        const assignedStaff = staff.find((s) => s.id === data.staff_id);
        if (!application) {
            throw new Error("Application not found");
        }
        return {
            ...application,
            assigned_to: data.staff_id,
            assigned_to_name: assignedStaff?.name || "Unknown Staff",
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }

    const result = await api.post<VisaApplication>(
        `/visa-applications/${id}/assign`,
        data
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get notes for an application
 */
export async function getApplicationNotes(id: string): Promise<InternalNote[]> {
    if (shouldMock("useMockVisa")) {
        return getMockApplicationNotes(id);
    }

    const result = await api.get<InternalNote[]>(
        `/visa-applications/${id}/notes`
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Add note to application
 */
export async function addApplicationNote(
    id: string,
    data: AddNoteRequest
): Promise<InternalNote> {
    if (shouldMock("useMockVisa")) {
        return {
            id: `note-${Date.now()}`,
            content: data.content,
            is_internal: data.is_internal,
            created_by: "current-user",
            created_by_name: "Current User",
            created_at: new Date().toISOString(),
        };
    }

    const result = await api.post<InternalNote>(
        `/visa-applications/${id}/notes`,
        data
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get documents for an application
 */
export async function getApplicationDocuments(
    id: string
): Promise<DocumentAttachment[]> {
    if (shouldMock("useMockVisa")) {
        return getMockApplicationDocuments(id);
    }

    const result = await api.get<DocumentAttachment[]>(
        `/visa-applications/${id}/documents`
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get audit log for an application
 */
export async function getApplicationAuditLog(
    id: string
): Promise<AuditLogEntry[]> {
    if (shouldMock("useMockVisa")) {
        return getMockApplicationAuditLog(id);
    }

    const result = await api.get<AuditLogEntry[]>(
        `/visa-applications/${id}/audit`
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

/**
 * Get staff members available for assignment
 */
export async function getVisaStaff(): Promise<
    { id: string; name: string; email: string }[]
> {
    if (shouldMock("useMockVisa")) {
        return getMockVisaStaff();
    }

    const result = await api.get<{ id: string; name: string; email: string }[]>(
        "/users/staff?role=visa"
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}
