"use server";

import { api } from "./client";
import { Client } from "./crm-constants";

export interface ListPagination {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
}

export interface ListResponse<T> {
    data: T[];
    pagination: ListPagination;
}

export interface OutstandingPayment {
    id: string;
    crm_client_id: string;
    total_expected_amount: number;
    total_paid_amount: number;
    balance: number;
    status: 'pending' | 'completed';
    created_at: string;
    updated_at: string;
    client?: Client;
    original_confirmation?: {
        id: string;
        product: string;
        service_description?: string | null;
        amount_expected: number;
        amount_paid: number;
        discount: number;
        payment_date: string;
    };
}

export interface PaymentConfirmation {
    id: string;
    user_id: string;
    crm_client_id: string;
    outstanding_payment_id: string | null;
    payer_name: string;
    product: string;
    service_description: string | null;
    amount_expected: number;
    discount: number;
    amount_paid: number;
    currency: string;
    payment_date: string;
    payment_method: string;
    deal: string | null;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    assigned_to: string | null;
    processed_by_id: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    // Relations (loaded via eager loading)
    client?: Client;
    outstandingPayment?: OutstandingPayment;
    user?: { id: string; name: string };
    processedBy?: { id: string; name: string };
    assignedTo?: { id: string; name: string };
    files?: Array<{
        id: string;
        filename?: string;
        original_name?: string;
        file_type?: string;
        file_size?: number;
    }>;
}

export interface PaymentConfirmationFilters {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'rejected';
    assigned?: boolean;
}

interface PaymentConfirmationsResponse {
    data: PaymentConfirmation[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export async function getPaymentConfirmations(
    filters: PaymentConfirmationFilters = {}
): Promise<ListResponse<PaymentConfirmation>> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.set("page", filters.page.toString());
    if (filters.limit) queryParams.set("limit", filters.limit.toString());
    if (filters.status) queryParams.set("status", filters.status);
    if (filters.assigned !== undefined) {
        queryParams.set("assigned", filters.assigned ? "1" : "0");
    }

    const response = await api.get<ListResponse<PaymentConfirmation>>(
        `/api/payment-confirmations?${queryParams.toString()}`
    );

    if (response.success) {
        return response.data;
    }

    console.error("Failed to fetch payment confirmations:", response.error);
    return { data: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } };
}

export async function createPaymentConfirmation(
    data: any
): Promise<{ success: boolean; payment_confirmation?: PaymentConfirmation; error?: string }> {
    const response = await api.post<any>("/api/payment-confirmations", data);

    if (response.success) {
        return { success: true, payment_confirmation: response.data?.payment_confirmation || response.data };
    }

    return { success: false, error: response.error?.error || "Failed to create payment confirmation" };
}

export async function approvePaymentConfirmation(
    id: string
): Promise<{ success: boolean; payment_confirmation?: PaymentConfirmation; error?: string }> {
    const response = await api.patch<any>(`/api/payment-confirmations/${id}/approve`, {});

    if (response.success) {
        return { success: true, payment_confirmation: response.data?.payment_confirmation || response.data };
    }

    return { success: false, error: response.error?.error || "Failed to approve payment confirmation" };
}

export async function rejectPaymentConfirmation(
    id: string,
    rejection_reason: string
): Promise<{ success: boolean; error?: string }> {
    const response = await api.patch<any>(`/api/payment-confirmations/${id}/reject`, { rejection_reason });

    if (response.success) {
        return { success: true };
    }

    return { success: false, error: response.error?.error || "Failed to reject payment confirmation" };
}

export async function assignPaymentConfirmation(
    id: string,
    assigned_to: string
): Promise<{ success: boolean; error?: string }> {
    const response = await api.patch<any>(`/api/payment-confirmations/${id}/assign`, { assigned_to });

    if (response.success) {
        return { success: true };
    }

    return { success: false, error: response.error?.error || "Failed to assign payment confirmation" };
}

export async function getOutstandingPayments(
    filters: { page?: number; limit?: number; status?: 'pending' | 'completed'; client_id?: string } = {}
): Promise<ListResponse<OutstandingPayment>> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.set("page", filters.page.toString());
    if (filters.limit) queryParams.set("limit", filters.limit.toString());
    if (filters.status) queryParams.set("status", filters.status);
    if (filters.client_id) queryParams.set("client_id", filters.client_id);

    const response = await api.get<ListResponse<OutstandingPayment>>(
        `/api/outstanding-payments?${queryParams.toString()}`
    );

    if (response.success) {
        return response.data;
    }

    console.error("Failed to fetch outstanding payments:", response.error);
    return { data: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
}

export async function markPaymentNotificationsAsRead(): Promise<boolean> {
    const response = await api.post<any>("/api/payment-confirmations/notifications/mark-viewed");
    return response.success;
}

export async function markAssignedDealsNotificationsAsRead(): Promise<boolean> {
    const response = await api.post<any>("/api/payment-confirmations/notifications/mark-assigned-viewed");
    return response.success;
}
