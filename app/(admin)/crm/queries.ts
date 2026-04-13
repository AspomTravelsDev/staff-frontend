import { getClients, getCRMStats } from "@/lib/api/crm";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import type { PaginatedResponse } from "@/lib/api/types";

export async function getAllClients(
    filters: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<Client>> {
    return getClients({
        page: filters.page,
        limit: filters.limit,
    });
}

export async function getClientStats(): Promise<CRMStats> {
    return getCRMStats({});
}
