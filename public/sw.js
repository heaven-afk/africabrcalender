// Service Worker for Esports Calendar Web Push Notifications
// Located at /public/sw.js — registered by NotificationBell component

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Esports Calendar", body: event.data.text(), url: "/" };
  }

  const { title = "Esports Calendar", body = "", url = "/", icon = "/favicon.png" } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/favicon.png",
      data: { url },
      tag: url, // collapses duplicate notifications for the same event
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing open tab if found
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open new tab
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Re-subscribe if browser rotates push keys
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((newSubscription) => {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("p256dh")))),
              auth: btoa(String.fromCharCode(...new Uint8Array(newSubscription.getKey("auth")))),
            },
          }),
        });
      })
  );
});
