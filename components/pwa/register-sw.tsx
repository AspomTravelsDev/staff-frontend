"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // ServiceWorker successfully registered
        })
        .catch((err) => {
          console.warn("ServiceWorker registration error:", err);
        });
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // In development, also register so PWA install prompt can be tested locally
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => {
          console.warn("ServiceWorker registration (dev) error:", err);
        });
    }
  }, []);

  return null;
}
