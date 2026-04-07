// Service Worker for Web Push Notifications only
// No caching, no offline support — just push handling

self.addEventListener('push', (event) => {
  let data = { title: '🙏 BibelBot', body: 'Dein täglicher Impuls ist da!' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // If not JSON, use text
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Dein täglicher Impuls ist da!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'bibelbot-daily',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title || '🙏 BibelBot', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return clients.openWindow(url);
    })
  );
});
