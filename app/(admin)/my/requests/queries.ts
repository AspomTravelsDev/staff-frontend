import { getRequests, type RequestItem } from "@/lib/api/requests";
import { getCurrentUser } from "@/lib/auth/session";

export async function getMyRequests(): Promise<RequestItem[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const result = await getRequests({ requester_id: user.id });
    return result.items ?? [];
}
