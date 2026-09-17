"use server";

import { api } from "./client";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  content_encoding?: string;
}

export async function getVapidPublicKey(): Promise<string | null> {
  const result = await api.get<{ code: string; data: { public_key: string } }>(
    "/api/push-subscriptions/vapid-public-key"
  );

  if (!result.success) {
    console.error("[Push API] Failed to fetch VAPID key:", result.error);
    return null;
  }

  const payload = (result.data as any).data || result.data;
  return payload.public_key || null;
}

export async function savePushSubscription(
  payload: PushSubscriptionPayload
): Promise<{ success: boolean; error?: string }> {
  const result = await api.post("/api/push-subscriptions", payload);

  if (!result.success) {
    console.error("[Push API] Failed to save subscription:", result.error);
    return { success: false, error: result.error?.error || "Failed to save subscription" };
  }

  return { success: true };
}

export async function deletePushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const result = await api.delete("/api/push-subscriptions", {
    body: { endpoint },
  });

  if (!result.success) {
    console.error("[Push API] Failed to delete subscription:", result.error);
    return { success: false, error: result.error?.error || "Failed to delete subscription" };
  }

  return { success: true };
}

export async function sendTestPushNotification(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const result = await api.post<{ code: string; message: string; data?: any }>(
    "/api/push-subscriptions/test"
  );

  if (!result.success) {
    console.error("[Push API] Failed to send test push:", result.error);
    return { success: false, error: result.error?.error || "Failed to send test push" };
  }

  return {
    success: true,
    message: (result.data as any)?.message || "Test notification sent successfully",
  };
}
