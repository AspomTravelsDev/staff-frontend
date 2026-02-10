"use server";

import { PaginatedResponse } from "./types";
import { shouldMock } from "./client";

// ============================================================================
// Types
// ============================================================================

export type CRMStatus = "Lead" | "Qualified" | "Negotiation" | "Customer" | "Lost";

export interface Client {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    status: CRMStatus;
    value: string;
    assignedTo: string;
    lastContact: string;
}

export interface CRMStats {
    totalClients: number;
    newLeads: number; // This month
    activeDeals: number; // Negotiation + Qualified
    conversionRate: string;
}

export interface CRMFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: CRMStatus;
}

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
// API Functions
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
                    c.email.toLowerCase().includes(search)
            );
        }

        if (filters.status) {
            filtered = filtered.filter(c => c.status === filters.status);
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const total = filtered.length;

        // Sort by name default
        filtered.sort((a, b) => a.name.localeCompare(b.name));

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

    return { items: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } };
}

export async function getCRMStats(): Promise<CRMStats> {
    if (shouldMock("useMockCrm")) {
        const clients = await getMockClients();

        const totalClients = clients.filter(c => c.status === "Customer").length;
        const newLeads = clients.filter(c => c.status === "Lead").length; // Mock: All 'Lead' status are new
        const activeDeals = clients.filter(c => ["Negotiation", "Qualified"].includes(c.status)).length;

        // Mock conversion rate
        const totalLeads = newLeads + totalClients;
        const conversionRate = totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) + "%" : "0%";

        return {
            totalClients,
            newLeads,
            activeDeals,
            conversionRate
        }
    }

    return {
        totalClients: 0,
        newLeads: 0,
        activeDeals: 0,
        conversionRate: "0%"
    }
}
