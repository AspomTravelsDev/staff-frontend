"use server";

import { PaginatedResponse } from "./types";
import { shouldMock, api } from "./client";
import type {
    Client,
    CRMFilters,
    CRMStats,
    CreateClientRequest,
    UpdateClientRequest,
} from "./crm-constants";

// ============================================================================
// API Functions — only async functions exported from "use server" files
// ============================================================================

export async function getClients(
    filters: CRMFilters = {}
): Promise<PaginatedResponse<Client>> {

    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.set("page", filters.page.toString());
    if (filters.limit) queryParams.set("limit", filters.limit.toString());
    if (filters.search) queryParams.set("search", filters.search);
    if (filters.status) queryParams.set("status", filters.status);
    if (filters.myClients) queryParams.set("my_clients", "true");
    if (filters.assignedTo) queryParams.set("assignedTo", filters.assignedTo);

    const response = await api.get<PaginatedResponse<Client>>(
        `/api/crm/clients?${queryParams.toString()}`
    );

    if (response.success) {
        return response.data;
    }

    console.error("Failed to fetch clients:", response.error);
    return { items: [], pagination: { page: 1, limit: 50, total: 0, total_pages: 0 } };
}

export async function getCRMStats(myClients: boolean = false, assignedTo?: string): Promise<CRMStats> {

    const queryParams = new URLSearchParams();
    if (myClients) queryParams.set("my_clients", "true");
    if (assignedTo) queryParams.set("assignedTo", assignedTo);

    const response = await api.get<CRMStats>(`/api/crm/stats?${queryParams.toString()}`);

    if (response.success) {
        return response.data;
    }

    console.error("Failed to fetch CRM stats:", response.error);
    return { totalPaid: 0, newPotentials: 0, activeDeals: 0, conversionRate: "0%" };
}

export async function createClient(
    data: CreateClientRequest
): Promise<{ success: boolean; client?: Client; error?: string }> {

    const response = await api.post<Client>("/api/crm/clients", data);

    if (response.success) {
        return { success: true, client: response.data };
    }

    return { success: false, error: response.error.error };
}

export async function bulkCreateClients(
    clients: CreateClientRequest[]
): Promise<{ success: boolean; data?: { imported: number; merged: number; skipped: number; errors: string[] }; error?: string }> {

    const response = await api.post<{ imported: number; merged: number; skipped: number; errors: string[] }>("/api/crm/clients/bulk", { clients });

    if (response.success) {
        return { success: true, data: response.data };
    }

    return { success: false, error: response.error.error };
}

export async function updateClient(
    id: string,
    data: UpdateClientRequest
): Promise<{ success: boolean; client?: Client; error?: string }> {

    const response = await api.patch<Client>(`/api/crm/clients/${id}`, data);

    if (response.success) {
        return { success: true, client: response.data };
    }

    return { success: false, error: response.error.error };
}

export async function deleteClient(
    id: string
): Promise<{ success: boolean; error?: string }> {

    const response = await api.delete(`/api/crm/clients/${id}`);

    if (response.success) {
        return { success: true };
    }

    return { success: false, error: response.error.error };
}
