"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getVapidPublicKey,
  savePushSubscription,
  deletePushSubscription,
  sendTestPushNotification,
} from "@/lib/api/push-subscriptions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionPending, setIsActionPending] = useState<boolean>(false);

  const checkSubscription = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription));
    } catch (err) {
      console.error("[Push Hook] Error checking push subscription:", err);
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported on this browser.");
      return false;
    }

    setIsActionPending(true);
    try {
      // 1. Request user permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Notification permission was denied.");
        return false;
      }

      // 2. Fetch public VAPID key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        toast.error("Unable to load push configuration from server.");
        return false;
      }

      // 3. Register push manager subscription
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });
      }

      const subscriptionJSON = subscription.toJSON();
      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        throw new Error("Invalid push subscription structure.");
      }

      // 4. Save to backend
      const saveRes = await savePushSubscription({
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
        },
      });

      if (!saveRes.success) {
        throw new Error(saveRes.error || "Server could not save subscription.");
      }

      setIsSubscribed(true);
      toast.success("Push notifications enabled! You will receive attendance and report reminders.");
      return true;
    } catch (error: any) {
      console.error("[Push Hook] Subscription failed:", error);
      toast.error(error.message || "Failed to enable push notifications.");
      return false;
    } finally {
      setIsActionPending(false);
    }
  };

  const unsubscribe = async () => {
    if (!isSupported) return false;

    setIsActionPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await deletePushSubscription(endpoint);
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled on this device.");
      return true;
    } catch (error: any) {
      console.error("[Push Hook] Unsubscribe failed:", error);
      toast.error("Failed to disable push notifications.");
      return false;
    } finally {
      setIsActionPending(false);
    }
  };

  const sendTest = async () => {
    setIsActionPending(true);
    try {
      const res = await sendTestPushNotification();
      if (res.success) {
        toast.success(res.message || "Test notification dispatched!");
      } else {
        toast.error(res.error || "Failed to dispatch test notification.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send test push.");
    } finally {
      setIsActionPending(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isActionPending,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
