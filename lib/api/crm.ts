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
// Mock Data Loader
// ============================================================================

const getMockClients = async (): Promise<Client[]> => {
    if (typeof window === "undefined") {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "data/mock/crm.json");
        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            return JSON.parse(fileContent);
        } catch (error) {
            console.error("Error reading mock crm data:", error);
            return [];
        }
    }
    return [];
};

// ============================================================================
// API Functions — only async functions exported from "use server" files
// ============================================================================

export async function getClients(
    filters: CRMFilters = {}
): Promise<PaginatedResponse<Client>> {
    if (shouldMock("useMockCrm")) {
        const clients = await getMockClients();
        let filtered = [...clients];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.name.toLowerCase().includes(search) ||
                    c.contactPerson.toLowerCase().includes(search) ||
                    c.email.toLowerCase().includes(search) ||
                    c.phone?.toLowerCase().includes(search) ||
                    c.service?.toLowerCase().includes(search)
            );
        }

        if (filters.status) {
            filtered = filtered.filter((c) => c.status === filters.status);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 50;
        const total = filtered.length;

        filtered.sort(
            (a, b) =>
                new Date(b.lastContact).getTime() - new Date(a.lastContact).getTime()
        );

        return {
            items: filtered.slice((page - 1) * limit, page * limit),
            pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
        };
    }

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
    if (shouldMock("useMockCrm")) {
        const clients = await getMockClients();

        const totalPaid = clients.filter((c) => c.status === "paid").length;
        const newPotentials = clients.filter((c) => c.status === "potential").length;
        const activeDeals = clients.filter((c) =>
            ["follow_up", "negotiation"].includes(c.status)
        ).length;

        const totalTracked = totalPaid + newPotentials;
        const conversionRate =
            totalTracked > 0
                ? ((totalPaid / totalTracked) * 100).toFixed(1) + "%"
                : "0%";

        return { totalPaid, newPotentials, activeDeals, conversionRate };
    }

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
    if (shouldMock("useMockCrm")) {
        const now = new Date().toISOString().split("T")[0];
        const newClient: Client = {
            id: `CRM-${Date.now()}`,
            name: data.name,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone ?? null,
            status: data.status,  // e.g. "potential", "paid" etc.
            service: data.service,
            source: data.source,
            notes: data.notes ?? null,
            assignedTo: data.assignedTo ?? null,
            lastContact: now,
            createdAt: now,
            createdBy: "Current User",
        };
        return { success: true, client: newClient };
    }

    const response = await api.post<Client>("/api/crm/clients", data);

    if (response.success) {
        return { success: true, client: response.data };
    }

    return { success: false, error: response.error.error };
}

export async function updateClient(
    id: string,
    data: UpdateClientRequest
): Promise<{ success: boolean; client?: Client; error?: string }> {
    if (shouldMock("useMockCrm")) {
        const now = new Date().toISOString().split("T")[0];
        return {
            success: true,
            client: { id, lastContact: now, ...data } as Client,
        };
    }

    const response = await api.patch<Client>(`/api/crm/clients/${id}`, data);

    if (response.success) {
        return { success: true, client: response.data };
    }

    return { success: false, error: response.error.error };
}

export async function deleteClient(
    id: string
): Promise<{ success: boolean; error?: string }> {
    if (shouldMock("useMockCrm")) {
        return { success: true };
    }

    const response = await api.delete(`/api/crm/clients/${id}`);

    if (response.success) {
        return { success: true };
    }

    return { success: false, error: response.error.error };
}
