"use server";

import { api } from "./client";
import type { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export type Severity = "low" | "medium" | "high" | "critical";
export type ComplianceStatus = "open" | "closed";

export interface ComplianceComment {
    id: string;
    occurrence_id: string;
    user_id: string;
    comment: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        image_url?: string;
    };
}

export interface ComplianceIssue {
    id: string;
    user_id: string;
    type: string;
    severity: Severity;
    status: ComplianceStatus;
    outcome: string | null;
    description: string;
    occurrence_date: string;
    date?: string; // Mapped for backward compatibility
    created_at: string;
    user_name?: string; // Mapped for UI
    user_department?: string; // Mapped for UI
    user?: {
        id: string;
        name: string;
        department?: string;
    };
    creator?: {
        id: string;
        name: string;
    };
    comments?: ComplianceComment[];
    deduction_days?: number;
    has_new_replies?: boolean;
}

export interface ComplianceStats {
    totalIssues: number;
    openIssues: number;
    resolvedIssues: number;
    totalDeductions: number;
    topOffender: {
        name: string;
        count: number;
    } | null;
    topDepartment: {
        name: string;
        count: number;
    } | null;
}

export interface SanctionStep {
    step: number;
    threshold: number;
    label: string;
}

export interface SanctionOccurrenceMarker {
    id: string;
    type: string;
    occurrence_date: string;
}

export interface SanctionGridItem {
    user_id: string;
    name: string;
    department?: string | null;
    role: string;
    issues_count: number;
    current_step: number;
    occurrence_markers: SanctionOccurrenceMarker[];
}

export interface SanctionGridResponse {
    windowStart: string;
    windowEnd: string;
    periodLabel: string;
    steps: SanctionStep[];
    items: SanctionGridItem[];
}

export interface ComplianceFilters {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    severity?: Severity;
    status?: ComplianceStatus;
    user_id?: string;
    type?: string;
    date_from?: string;
    date_to?: string;
}

// ============================================================================
// API Functions
// ============================================================================

export async function getComplianceIssues(
    filters: ComplianceFilters = {}
): Promise<PaginatedResponse<ComplianceIssue>> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.department) params.append("department", filters.department);
    if (filters.severity) params.append("severity", filters.severity);
    if (filters.status) params.append("status", filters.status);
    if (filters.user_id) params.append("user_id", filters.user_id);
    if (filters.type) params.append("type", filters.type);
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);

    const result = await api.get<PaginatedResponse<ComplianceIssue>>(`/api/compliance?${params.toString()}`);

    if (!result.success) {
        throw new Error(result.error.error);
    }

    const response = result.data;
    const items = response.items.map(item => ({
        ...item,
        user_name: item.user?.name,
        user_department: item.user?.department,
        date: item.occurrence_date,
    }));

    return { ...response, items };
}

export async function getComplianceStats(filters: { user_id?: string } = {}): Promise<ComplianceStats> {
    const params = new URLSearchParams();
    if (filters.user_id) params.append("user_id", filters.user_id);

    const result = await api.get<ComplianceStats>(`/api/compliance/stats?${params.toString()}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function getComplianceSanctionGrid(filters: { user_id?: string } = {}): Promise<SanctionGridResponse> {
    const params = new URLSearchParams();
    if (filters.user_id) params.append("user_id", filters.user_id);

    const result = await api.get<SanctionGridResponse>(`/api/compliance/sanction-grid?${params.toString()}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function getComplianceDetails(id: string): Promise<ComplianceIssue> {
    const result = await api.get<ComplianceIssue>(`/api/compliance/${id}`);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function addComplianceOccurrence(data: Partial<ComplianceIssue>): Promise<ComplianceIssue> {
    const result = await api.post<ComplianceIssue>("/api/compliance", data);
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function addComplianceComment(id: string, comment: string): Promise<ComplianceComment> {
    const result = await api.post<ComplianceComment>(`/api/compliance/${id}/comments`, { comment });
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}

export async function resolveComplianceOccurrence(id: string, outcome: string, deductionDays?: number): Promise<ComplianceIssue> {
    const result = await api.post<ComplianceIssue>(`/api/compliance/${id}/resolve`, {
        outcome,
        deduction_days: deductionDays
    });
    if (!result.success) {
        throw new Error(result.error.error);
    }
    return result.data;
}
