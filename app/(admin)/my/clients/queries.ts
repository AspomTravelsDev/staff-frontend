import { getClients, getCRMStats } from "@/lib/api/crm";
import type { Client, CRMStats } from "@/lib/api/crm-constants";
import type { CRMStatus } from "@/lib/api/crm-constants";
import type { PaginatedResponse } from "@/lib/api/types";

interface GetAllClientsParams {
    page: number;
    limit: number;
    search?: string;
    status?: CRMStatus;
    service?: string;
    source?: string;
}

type CRMStatsFilterParams = Pick<
    GetAllClientsParams,
    "search" | "status" | "service" | "source"
>;

export async function getAllClients(
    params: GetAllClientsParams
): Promise<PaginatedResponse<Client>> {
    return getClients({
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
        service: params.service,
        source: params.source,
        myClients: true,
    });
}

export async function getClientStats(
    filters: CRMStatsFilterParams = {}
): Promise<CRMStats> {
    return getCRMStats({
        myClients: true,
        search: filters.search,
        status: filters.status,
        service: filters.service,
        source: filters.source,
    });
}
