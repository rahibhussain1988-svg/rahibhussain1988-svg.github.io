// Clinic Care Application Service Worker
const CACHE_NAME = 'apex-clinic-care-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/pwa-icon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-512.png'
];

// Install: Pre-cache app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial failure:', err);
      });
    })
  );
});

// Activate: Clean up previous cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate with SPA Navigation fallback for offline resilience
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET requests and chrome-extension / non-http schemes
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. Navigation requests (HTML SPA loading)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Cache successful navigation responses
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: serve cached index.html
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts, Icons, Audio)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, return cached response if present
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for manual skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
