"use server";

import { revalidatePath } from "next/cache";

import { api } from "./client";

export type LoanRequestStatus =
    | "pending_hr"
    | "pending_accounts"
    | "approved_accounts"
    | "rejected_hr"
    | "rejected_accounts"
    | "paid";

export interface LoanRequestPayload {
    amount: number;
    reason: string;
    repayment_months?: number;
    suggested_monthly_deduction?: number;
}

export interface ReopenLoanRequestPayload {
    amount?: number;
    reason?: string;
    repayment_months?: number;
}

export interface LoanRequestRecord {
    id: string;
    requester_id: string;
    requester?: {
        id: string;
        name: string;
        role?: string;
        department?: string;
        gross_pay?: string;
    };
    hr_decider?: {
        id: string;
        name: string;
    };
    hrDecider?: {
        id: string;
        name: string;
    };
    accounts_decider?: {
        id: string;
        name: string;
    };
    accountsDecider?: {
        id: string;
        name: string;
    };
    paid_by_user?: {
        id: string;
        name: string;
    };
    paidBy?: {
        id: string;
        name: string;
    };
    paid_by?: string | {
        id: string;
        name: string;
    };
    amount: string;
    reason: string;
    repayment_months: number | null;
    suggested_monthly_deduction: string | null;
    computed_monthly_deduction?: string | null;
    status: LoanRequestStatus;
    hr_comment: string | null;
    accounts_comment: string | null;
    hr_decided_at: string | null;
    accounts_decided_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface LoanRequestListResponse {
    data: LoanRequestRecord[];
    summary?: LoanRequestSummary;
}

export interface LoanRequestSummary {
    total_requested_amount: number;
    pending_balance: number;
    open_active_count: number;
    paid_count: number;
}

export interface LoanRequestFilters {
    status?: LoanRequestStatus;
    from_date?: string;
    to_date?: string;
    search?: string;
}

interface LoanRequestMutationResponse {
    message: string;
    data: LoanRequestRecord;
}

function buildParams(filters?: LoanRequestFilters): string {
    const params = new URLSearchParams();
    if (!filters) return params.toString();

    if (filters.status) params.append("status", filters.status);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);
    if (filters.search) params.append("search", filters.search);

    return params.toString();
}

export async function getMyLoanRequests(filters?: LoanRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/loan-requests/my?${query}` : "/api/loan-requests/my";
    const response = await api.get<LoanRequestListResponse>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function markLoanRequestNotificationsViewed() {
    const response = await api.post<{ message: string }>("/api/loan-requests/notifications/mark-viewed");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getAllLoanRequests(filters?: LoanRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/loan-requests?${query}` : "/api/loan-requests";
    const response = await api.get<LoanRequestListResponse>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getLoanRequestStats(filters?: LoanRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/loan-requests/stats?${query}` : "/api/loan-requests/stats";
    const response = await api.get<LoanRequestSummary>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getLoanRequestsHrQueue() {
    const response = await api.get<LoanRequestListResponse>("/api/loan-requests/hr-queue");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getLoanRequestsAccountsQueue() {
    const response = await api.get<LoanRequestListResponse>("/api/loan-requests/accounts-queue");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function createLoanRequest(payload: LoanRequestPayload): Promise<{ success: boolean; data?: LoanRequestRecord; error?: string }> {
    const response = await api.post<LoanRequestMutationResponse>("/api/loan-requests", payload);
    if (!response.success) {
        return { success: false, error: response.error?.error || "Failed to submit loan request" };
    }

    revalidatePath("/my/loan-requests");
    revalidatePath("/hr/loan-requests");
    revalidatePath("/accounts/loan-requests");

    return { success: true, data: response.data.data };
}

export async function decideLoanRequestByHr(
    id: string,
    decision: "approved" | "rejected",
    comment?: string
): Promise<{ success: boolean; data?: LoanRequestRecord; error?: string }> {
    const response = await api.patch<LoanRequestMutationResponse>(`/api/loan-requests/${id}/hr-decision`, {
        decision,
        comment,
    });

    if (!response.success) {
        return { success: false, error: response.error?.error || `Failed to ${decision} loan request` };
    }

    revalidatePath("/hr/loan-requests");
    revalidatePath("/accounts/loan-requests");

    return { success: true, data: response.data.data };
}

export async function decideLoanRequestByAccounts(
    id: string,
    decision: "approved" | "rejected",
    comment?: string
): Promise<{ success: boolean; data?: LoanRequestRecord; error?: string }> {
    const response = await api.patch<LoanRequestMutationResponse>(`/api/loan-requests/${id}/accounts-decision`, {
        decision,
        comment,
    });

    if (!response.success) {
        return { success: false, error: response.error?.error || `Failed to ${decision} loan request` };
    }

    revalidatePath("/accounts/loan-requests");

    return { success: true, data: response.data.data };
}

export async function markLoanRequestPaid(id: string): Promise<{ success: boolean; data?: LoanRequestRecord; error?: string }> {
    const response = await api.patch<LoanRequestMutationResponse>(`/api/loan-requests/${id}/mark-paid`);
    if (!response.success) {
        return { success: false, error: response.error?.error || "Failed to mark loan request as paid" };
    }

    revalidatePath("/accounts/loan-requests");
    revalidatePath("/my/loan-requests");

    return { success: true, data: response.data.data };
}

export async function reopenLoanRequest(
    id: string,
    payload: ReopenLoanRequestPayload
): Promise<{ success: boolean; data?: LoanRequestRecord; error?: string }> {
    const response = await api.patch<LoanRequestMutationResponse>(`/api/loan-requests/${id}/reopen`, payload);
    if (!response.success) {
        return { success: false, error: response.error?.error || "Failed to reopen loan request" };
    }

    revalidatePath("/my/loan-requests");
    revalidatePath("/hr/loan-requests");

    return { success: true, data: response.data.data };
}
