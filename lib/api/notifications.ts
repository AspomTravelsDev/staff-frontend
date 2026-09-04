"use server";

import { api } from "./client";

export type NotificationCountValue =
    | number
    | {
          count: number;
          label?: string;
          latest_id?: string | null;
          items?: { conversation_id: string; sender_name: string; count: number }[];
      };

export async function getNotifications(): Promise<Record<string, NotificationCountValue>> {

    const result = await api.get<Record<string, any>>("/api/notifications");


    if (!result.success) {
        console.error("[Notifications API] Failed to fetch:", result.error);
        return {};
    }

    // Check if the backend wraps it in `data: { code: 'SUCCESS', data: { ... } }`
    // The standard apiClient returns ApiResponse. If the backend returned `{ code: 'SUCCESS', data: { announcements: 1 } }`
    // Then `result.data` is that whole object.
    const actualData = (result.data as any).data || result.data;

    return actualData;
}

export async function clearAllNotifications(): Promise<Record<string, NotificationCountValue>> {
    const result = await api.post<Record<string, any>>("/api/notifications/clear-all");

    if (!result.success) {
        console.error("[Notifications API] Failed to clear all:", result.error);
        throw new Error(result.error?.error || "Failed to clear notifications");
    }

    const actualData = (result.data as any)?.data || result.data;
    return actualData;
}

