/**
 * Visa API Module
 *
 * API functions for visa applications management.
 * Used by React Query hooks and Server Actions.
 */

import { api } from "./client";
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

export type VisaInformationCategory =
    | "Checklist"
    | "Submission Info"
    | "Embassy Details"
    | "FAQ";

/**
 * Visa Information entity
 */
export interface VisaInformation {
    id: string;
    category: VisaInformationCategory;
    country: string | null;
    title: string;
    content: string;
    author_id: string;
    author?: {
        id: string;
        name: string;
        staff_id: string;
    };
    created_at: string;
    updated_at: string;
}

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

export interface CreateVisaInformationRequest {
    category: VisaInformationCategory;
    country?: string | null;
    title: string;
    content: string;
}

export type UpdateVisaInformationRequest = Partial<CreateVisaInformationRequest>;

// ============================================================================
// Visa Application API Functions
// ============================================================================

/**
 * Get paginated list of visa applications
 */
export async function getVisaApplications(
    filters: VisaApplicationFilters = {}
): Promise<PaginatedResponse<VisaApplicationListItem>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    const result = await api.get<PaginatedResponse<VisaApplicationListItem>>(
        `/api/visa-applications?${params.toString()}`
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
    const result = await api.get<VisaApplication>(`/api/visa-applications/${id}`);

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
    const result = await api.patch<VisaApplication>(
        `/api/visa-applications/${id}/status`,
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
    const result = await api.post<VisaApplication>(
        `/api/visa-applications/${id}/assign`,
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
    const result = await api.get<InternalNote[]>(
        `/api/visa-applications/${id}/notes`
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
    const result = await api.post<InternalNote>(
        `/api/visa-applications/${id}/notes`,
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
    const result = await api.get<DocumentAttachment[]>(
        `/api/visa-applications/${id}/documents`
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
    const result = await api.get<AuditLogEntry[]>(
        `/api/visa-applications/${id}/audit`
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
    const result = await api.get<{ id: string; name: string; email: string }[]>(
        "/api/users/staff?role=visa"
    );

    if (!result.success) {
        throw new Error(result.error.error);
    }

    return result.data;
}

// ============================================================================
// Visa Information Desk API Functions
// ============================================================================

/**
 * Get visa information entries
 */
export async function getVisaInformation(
    filters?: { category?: VisaInformationCategory; country?: string }
): Promise<VisaInformation[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.country) params.append("country", filters.country);

    const result = await api.get<VisaInformation[]>(`/api/visa-information?${params.toString()}`);
    if (!result.success) throw new Error(result.error.error);
    return result.data;
}

/**
 * Create visa information
 */
export async function createVisaInformation(data: CreateVisaInformationRequest): Promise<VisaInformation> {
    const result = await api.post<VisaInformation>("/api/visa-information", data);
    if (!result.success) throw new Error(result.error.error);
    return result.data;
}

/**
 * Update visa information
 */
export async function updateVisaInformation(id: string, data: UpdateVisaInformationRequest): Promise<VisaInformation> {
    const result = await api.patch<VisaInformation>(`/api/visa-information/${id}`, data);
    if (!result.success) throw new Error(result.error.error);
    return result.data;
}

/**
 * Delete visa information
 */
export async function deleteVisaInformation(id: string): Promise<boolean> {
    const result = await api.delete<{ success: boolean }>(`/api/visa-information/${id}`);
    if (!result.success) throw new Error(result.error.error);
    return true;
}
