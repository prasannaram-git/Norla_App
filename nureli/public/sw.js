// Norla PWA Service Worker v2
// In development, this SW immediately unregisters itself.

const IS_LOCALHOST = (typeof location !== 'undefined') &&
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

// DEVELOPMENT: Self-destruct immediately
if (IS_LOCALHOST) {
  self.addEventListener('install', () => { self.skipWaiting(); });
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration.unregister().then(() => {
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
    );
  });
} else {
  // PRODUCTION: Normal caching behavior
  const CACHE_NAME = 'norla-v2';
  const STATIC_ASSETS = ['/logo.png', '/logo-bg.png', '/manifest.json'];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
    );
    self.clients.claim();
  });

  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET') return;
    if (url.pathname.startsWith('/api/')) return;

    // Network-first for pages
    if (event.request.mode === 'navigate') {
      event.respondWith(
        fetch(event.request)
          .then((r) => { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, c)); return r; })
          .catch(() => caches.match(event.request).then((c) => c || caches.match('/dashboard')))
      );
      return;
    }

    // Cache-first for assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((r) => {
          if (r.ok) { const c = r.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, c)); }
          return r;
        });
      })
    );
  });

  self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
  });
}
