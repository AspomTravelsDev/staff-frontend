const CACHE_NAME = "aspom-portal-cache-v5";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        "/android-chrome-192x192.png",
        "/favicon-32x32.png",
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Only document navigation needs an offline fallback. Uploads, server actions,
// API calls, and Next.js data requests use the browser's normal networking.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate" ||
    url.origin !== self.location.origin ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    /\.[a-zA-Z0-9]+$/.test(url.pathname)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const offlinePage = await cache.match(OFFLINE_URL);
        if (offlinePage) return offlinePage;
      } catch {
        // Storage can be unavailable; still return a valid response.
      }
      return new Response("You are offline. Reconnect and reload this page.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    })
  );
});

// Push notification listener
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "ASPOM Portal Notification",
    body: "You have a new update from ASPOM Staff Portal.",
    icon: "/android-chrome-192x192.png",
    badge: "/favicon-32x32.png",
    data: {
      url: "/",
    },
    unreadCount: null,
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      notificationData = {
        title: parsed.title || notificationData.title,
        body: parsed.body || notificationData.body,
        icon: parsed.icon || notificationData.icon,
        badge: parsed.badge || notificationData.badge,
        data: parsed.data || { url: parsed.url || "/" },
        unreadCount:
          typeof parsed.unreadCount === "number"
            ? parsed.unreadCount
            : typeof parsed.data?.unreadCount === "number"
              ? parsed.data.unreadCount
              : null,
        actions: parsed.actions || [],
        tag: parsed.tag || undefined,
        renotify: parsed.renotify || false,
      };
    } catch {
      notificationData.body = event.data.text();
    }
  }

  const work = [
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      actions: notificationData.actions,
      tag: notificationData.tag,
      renotify: notificationData.renotify,
    }),
  ];

  if (typeof notificationData.unreadCount === "number") {
    const badgeUpdate =
      notificationData.unreadCount > 0
        ? self.navigator.setAppBadge?.(notificationData.unreadCount)
        : self.navigator.clearAppBadge?.();
    if (badgeUpdate) work.push(badgeUpdate.catch(() => undefined));
  }

  event.waitUntil(Promise.all(work));
});

// Handle notification click to navigate user
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const targetUrl =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : "/";

  const resolvedUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open with the app, navigate it and bring to front
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(resolvedUrl);
          }
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(resolvedUrl);
      }
    })
  );
});

// Listen for messages from client tabs (e.g. Clear All)
self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.action === "clear_all_notifications") {
    event.waitUntil(
      Promise.all([
        self.registration.getNotifications().then((notifications) => {
          return Promise.all(notifications.map((n) => n.close()));
        }),
        self.navigator.clearAppBadge?.().catch(() => undefined),
      ])
    );
  } else if (event.data.action === "clear_notification_tag" && event.data.tag) {
    event.waitUntil(
      self.registration.getNotifications({ tag: event.data.tag }).then((notifications) => {
        return Promise.all(notifications.map((n) => n.close()));
      })
    );
  }
});


