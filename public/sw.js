// Service Worker: Web Push + Offline App-Shell (Phase 4)
const CACHE = 'bibelbot-v2';
const CORE = ['/', '/index.html', '/manifest.json', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Only handle same-origin — never touch Supabase / AI Gateway / analytics endpoints.
  if (url.origin !== self.location.origin) return;

  // Never cache OAuth callback or auth flows
  if (url.pathname.startsWith('/~oauth') || url.pathname.startsWith('/auth')) return;

  // HTML navigations: network-first, fallback to cached shell (offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Static assets: cache-first with background revalidation (stale-while-revalidate).
  if (/\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
  }
});

self.addEventListener('push', (event) => {
  let data = { title: '🙏 BibelBot', body: 'Dein täglicher Impuls ist da!' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || 'Dein täglicher Impuls ist da!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'bibelbot-daily',
    renotify: true,
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🙏 BibelBot', options),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate?.(url).catch(() => {});
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});
