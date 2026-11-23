"use server";

import { api } from "./client";

export type NotificationCountValue =
    | number
    | {
          count: number;
          label?: string;
          url?: string;
          appraisal_count?: number;
          monthly_kpi_count?: number;
          latest_id?: string | null;
          view?: "responses" | "details";
          items?: { conversation_id: string; sender_name: string; count: number }[];
          task_items?: { task_id: string; title: string; body: string; count: number; view: "assigned_to_me" | "assigned_by_me" }[];
          recruitment_items?: { id: string; title: string; body: string; count: number; url: string }[];
          payroll_items?: { id: string; title: string; body: string; count: number; url: string }[];
          payment_items?: { id: string; title: string; message: string; count: number; url: string }[];
          performance_items?: { id: number | string; title: string; body: string; count: number; url: string }[];
      };

type NotificationCounts = Record<string, NotificationCountValue>;
type NotificationResponse = NotificationCounts | { code: string; data: NotificationCounts };

function unwrapNotifications(response: NotificationResponse): NotificationCounts {
    return "code" in response && typeof response.code === "string" && "data" in response
        ? response.data as NotificationCounts
        : response as NotificationCounts;
}

export async function getNotifications(): Promise<Record<string, NotificationCountValue>> {

    const result = await api.get<NotificationResponse>("/api/notifications");


    if (!result.success) {
        console.error("[Notifications API] Failed to fetch:", result.error);
        return {};
    }

    // Check if the backend wraps it in `data: { code: 'SUCCESS', data: { ... } }`
    // The standard apiClient returns ApiResponse. If the backend returned `{ code: 'SUCCESS', data: { announcements: 1 } }`
    // Then `result.data` is that whole object.
    const actualData = unwrapNotifications(result.data);

    return actualData;
}

export async function clearAllNotifications(): Promise<Record<string, NotificationCountValue>> {
    const result = await api.post<NotificationResponse>("/api/notifications/clear-all");

    if (!result.success) {
        console.error("[Notifications API] Failed to clear all:", result.error);
        return {};
    }

    const actualData = unwrapNotifications(result.data);
    return actualData || {};
}
