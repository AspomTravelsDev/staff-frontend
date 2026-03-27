"use server";

import { revalidatePath } from "next/cache";

import { api } from "./client";

export type SalaryAdvanceRequestStatus =
    | "pending_hr"
    | "pending_accounts"
    | "approved_accounts"
    | "rejected_hr"
    | "rejected_accounts"
    | "paid";

export interface SalaryAdvanceRequestPayload {
    amount: number;
    reason: string;
    repayment_months?: number;
    recommended_deduction_amount?: number;
}

export interface ReopenSalaryAdvanceRequestPayload {
    amount?: number;
    reason?: string;
    repayment_months?: number;
}

export interface SalaryAdvanceRequestRecord {
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
    repayment_months?: number | null;
    recommended_deduction_amount: string | null;
    deduction_mode?: string | null;
    status: SalaryAdvanceRequestStatus;
    hr_comment: string | null;
    accounts_comment: string | null;
    hr_decided_at: string | null;
    accounts_decided_at: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface SalaryAdvanceRequestListResponse {
    data: SalaryAdvanceRequestRecord[];
    summary?: SalaryAdvanceRequestSummary;
}

export interface SalaryAdvanceRequestSummary {
    total_requested_amount: number;
    pending_balance: number;
    open_active_count: number;
    paid_count: number;
}

export interface SalaryAdvanceRequestFilters {
    status?: SalaryAdvanceRequestStatus;
    from_date?: string;
    to_date?: string;
    search?: string;
}

interface SalaryAdvanceRequestMutationResponse {
    message: string;
    data: SalaryAdvanceRequestRecord;
}

function buildParams(filters?: SalaryAdvanceRequestFilters): string {
    const params = new URLSearchParams();
    if (!filters) return params.toString();

    if (filters.status) params.append("status", filters.status);
    if (filters.from_date) params.append("from_date", filters.from_date);
    if (filters.to_date) params.append("to_date", filters.to_date);
    if (filters.search) params.append("search", filters.search);

    return params.toString();
}

export async function getMySalaryAdvanceRequests(filters?: SalaryAdvanceRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/salary-advance-requests/my?${query}` : "/api/salary-advance-requests/my";
    const response = await api.get<SalaryAdvanceRequestListResponse>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function markSalaryAdvanceNotificationsViewed() {
    const response = await api.post<{ message: string }>("/api/salary-advance-requests/notifications/mark-viewed");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getAllSalaryAdvanceRequests(filters?: SalaryAdvanceRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/salary-advance-requests?${query}` : "/api/salary-advance-requests";
    const response = await api.get<SalaryAdvanceRequestListResponse>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getSalaryAdvanceRequestStats(filters?: SalaryAdvanceRequestFilters) {
    const query = buildParams(filters);
    const url = query ? `/api/salary-advance-requests/stats?${query}` : "/api/salary-advance-requests/stats";
    const response = await api.get<SalaryAdvanceRequestSummary>(url);
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getSalaryAdvanceRequestsHrQueue() {
    const response = await api.get<SalaryAdvanceRequestListResponse>("/api/salary-advance-requests/hr-queue");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function getSalaryAdvanceRequestsAccountsQueue() {
    const response = await api.get<SalaryAdvanceRequestListResponse>("/api/salary-advance-requests/accounts-queue");
    if (!response.success) throw new Error(response.error.error);
    return response.data;
}

export async function createSalaryAdvanceRequest(payload: SalaryAdvanceRequestPayload) {
    const response = await api.post<SalaryAdvanceRequestMutationResponse>("/api/salary-advance-requests", payload);
    if (!response.success) throw new Error(response.error.error);

    revalidatePath("/my/salary-advance-requests");
    revalidatePath("/hr/salary-advance-requests");
    revalidatePath("/accounts/salary-advance-requests");

    return response.data.data;
}

export async function decideSalaryAdvanceRequestByHr(
    id: string,
    decision: "approved" | "rejected",
    comment?: string
) {
    const response = await api.patch<SalaryAdvanceRequestMutationResponse>(`/api/salary-advance-requests/${id}/hr-decision`, {
        decision,
        comment,
    });

    if (!response.success) throw new Error(response.error.error);

    revalidatePath("/hr/salary-advance-requests");
    revalidatePath("/accounts/salary-advance-requests");

    return response.data.data;
}

export async function decideSalaryAdvanceRequestByAccounts(
    id: string,
    decision: "approved" | "rejected",
    comment?: string
) {
    const response = await api.patch<SalaryAdvanceRequestMutationResponse>(`/api/salary-advance-requests/${id}/accounts-decision`, {
        decision,
        comment,
    });

    if (!response.success) throw new Error(response.error.error);

    revalidatePath("/accounts/salary-advance-requests");

    return response.data.data;
}

export async function markSalaryAdvanceRequestPaid(id: string) {
    const response = await api.patch<SalaryAdvanceRequestMutationResponse>(`/api/salary-advance-requests/${id}/mark-paid`);
    if (!response.success) throw new Error(response.error.error);

    revalidatePath("/accounts/salary-advance-requests");
    revalidatePath("/my/salary-advance-requests");

    return response.data.data;
}

export async function reopenSalaryAdvanceRequest(
    id: string,
    payload: ReopenSalaryAdvanceRequestPayload
) {
    const response = await api.patch<SalaryAdvanceRequestMutationResponse>(
        `/api/salary-advance-requests/${id}/reopen`,
        payload
    );
    if (!response.success) throw new Error(response.error.error);

    revalidatePath("/my/salary-advance-requests");
    revalidatePath("/hr/salary-advance-requests");

    return response.data.data;
}
