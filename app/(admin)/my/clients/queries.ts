import { getClients, getCRMStats } from "@/lib/api/crm";
import type { Client, CRMStats } from "@/lib/api/crm-constants";

export async function getAllClients(): Promise<Client[]> {
    const result = await getClients({ limit: 100, myClients: true });
    return result.items;
}

export async function getClientStats(): Promise<CRMStats> {
    return getCRMStats(true); // Pass true to fetch only my clients' stats
}
