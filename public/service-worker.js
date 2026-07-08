self.addEventListener('install', (event) => {
  const assets = [
    '/',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-180.png',
    '/favicon.ico',
  ];

  event.waitUntil(
    caches.open('facturador-v1').then((cache) => cache.addAll(assets))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== 'facturador-v1')
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open('facturador-v1').then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache full HTTP 200 responses. Do not cache 206 Partial Content (videos/audio).
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open('facturador-v1').then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
