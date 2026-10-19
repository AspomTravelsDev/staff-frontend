"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const enabled = process.env.NODE_ENV === "production"
      || process.env.NEXT_PUBLIC_ENABLE_DEV_SERVICE_WORKER === "true";
    if (enabled) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch((err) => {
        console.warn("ServiceWorker registration error:", err);
      });
      return;
    }

    // A worker installed by an earlier local build survives hard refreshes.
    // Remove only this portal's worker; existing tabs release it on navigation.
    navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      const scriptUrl = new URL("/sw.js", window.location.origin).href;
      await Promise.all(registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL === scriptUrl),
      ).map((registration) => registration.unregister()));
    }).catch((err) => {
      console.warn("Could not remove the development service worker:", err);
    });
  }, []);

  return null;
}
