"use server";

import { api } from "./client";
import type { PaginatedResponse } from "./types";

// ============================================================================
// Types
// ============================================================================

export type {
    Severity,
    ComplianceStatus,
    ComplianceComment,
    ComplianceIssue,
    ComplianceStats,
    SanctionStep,
    SanctionOccurrenceMarker,
    SanctionGridItem,
    PolicyBreakdownRule,
    SanctionGridResponse,
    ComplianceFilters,
} from "@/lib/types/compliance";

import type {
    ComplianceIssue,
    ComplianceStats,
    SanctionGridResponse,
    ComplianceComment,
    ComplianceFilters,
    Severity,
} from "@/lib/types/compliance";

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

export type ComplianceActionResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

export async function addComplianceOccurrence(data: Partial<ComplianceIssue>): Promise<ComplianceActionResult<ComplianceIssue>> {
    const result = await api.post<ComplianceIssue>("/api/compliance", data);
    if (!result.success) {
        return { success: false, error: result.error?.error || "Failed to add compliance occurrence" };
    }
    return { success: true, data: result.data };
}

export async function addBatchComplianceOccurrences(data: {
    user_ids: string[];
    type: string;
    points?: number;
    occurrence_date: string;
    severity: Severity;
    description: string;
}): Promise<ComplianceActionResult<ComplianceIssue[]>> {
    const result = await api.post<ComplianceIssue[]>("/api/compliance", data);
    if (!result.success) {
        return { success: false, error: result.error?.error || "Failed to add compliance occurrences" };
    }
    return { success: true, data: result.data };
}

export async function addComplianceComment(id: string, comment: string): Promise<ComplianceActionResult<ComplianceComment>> {
    const result = await api.post<ComplianceComment>(`/api/compliance/${id}/comments`, { comment });
    if (!result.success) {
        return { success: false, error: result.error?.error || "Failed to post comment" };
    }
    return { success: true, data: result.data };
}

export async function resolveComplianceOccurrence(id: string, outcome: string, deductionDays?: number, points?: number): Promise<ComplianceActionResult<ComplianceIssue>> {
    const result = await api.post<ComplianceIssue>(`/api/compliance/${id}/resolve`, {
        outcome,
        deduction_days: deductionDays,
        points: points,
    });
    if (!result.success) {
        return { success: false, error: result.error?.error || "Failed to record disciplinary action" };
    }
    return { success: true, data: result.data };
}

export async function deleteComplianceIssue(id: string): Promise<ComplianceActionResult<void>> {
    const result = await api.delete(`/api/compliance/${id}`);
    if (!result.success) {
        return { success: false, error: result.error?.error || "Failed to delete compliance issue" };
    }
    return { success: true };
}
