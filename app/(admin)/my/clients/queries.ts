import { getClients, getCRMStats } from "@/lib/api/crm";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import type { CRMStatus } from "@/lib/api/crm-constants";
import type { PaginatedResponse } from "@/lib/api/types";

interface GetAllClientsParams {
    page: number;
    limit: number;
    search?: string;
    status?: CRMStatus;
}

export async function getAllClients(
    params: GetAllClientsParams
): Promise<PaginatedResponse<Client>> {
    return getClients({
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        myClients: true,
    });
}

export async function getClientStats(): Promise<CRMStats> {
    return getCRMStats(true); // Pass true to fetch only my clients' stats
}
