"use server";

import { api } from "./client";

export async function getNotifications(): Promise<Record<string, number>> {
    console.log("[Notifications API] Fetching notifications...");
    const result = await api.get<Record<string, number>>("/api/notifications");
    console.log("[Notifications API] Raw Result:", JSON.stringify(result));

    if (!result.success) {
        console.error("[Notifications API] Failed to fetch:", result.error);
        return {};
    }

    // Check if the backend wraps it in `data: { code: 'SUCCESS', data: { ... } }`
    // The standard apiClient returns ApiResponse. If the backend returned `{ code: 'SUCCESS', data: { announcements: 1 } }`
    // Then `result.data` is that whole object.
    const actualData = (result.data as any).data || result.data;
    console.log("[Notifications API] Parsed Data:", actualData);

    return actualData as Record<string, number>;
}
