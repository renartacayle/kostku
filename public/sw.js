const CACHE_NAME = 'kostku-cache-v146';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/version.json',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install Event - Precache shell and skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[KostKu SW] Purging stale cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for skip waiting message from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event - Smart Version-Aware & Kuota-Friendly Cache Strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip caching for non-GET, dynamic API routes (except app-version), binary downloads
  if (
    event.request.method !== 'GET' ||
    (url.pathname.startsWith('/api') && !url.pathname.includes('app-version')) ||
    url.pathname.startsWith('/downloads') ||
    url.pathname.startsWith('/download') ||
    url.pathname.startsWith('/unduh')
  ) {
    return;
  }

  // 2. Navigation / HTML Document requests: Network-First with quick timeout
  // Ensures fresh index.html when online, but falls back to cached shell when offline
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 3. Lightweight Version Check (version.json / api/app-version): Network-First (~60 bytes only)
  if (url.pathname === '/version.json' || url.pathname.includes('app-version')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. HASHED STATIC ASSETS (/assets/*): 100% Cache-First (Hemat Kuota & Instant Load!)
  // Because Vite gives immutable content hashes to filenames, if it's in cache, serve immediately!
  // NO background network fetch = ZERO kuota terbuang!
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // If valid cached response exists, return IMMEDIATELY without hitting the network
        if (cachedResponse) {
          const cachedType = cachedResponse.headers.get('content-type') || '';
          // Ensure it's not poisoned with text/html fallback
          if (!cachedType.includes('text/html')) {
            return cachedResponse;
          }
          // If poisoned, delete from cache
          caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
        }

        // Only fetch from network if NOT in cache
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const contentType = networkResponse.headers.get('content-type') || '';
              if (contentType.includes('text/html')) {
                return new Response('Chunk not found on server', {
                  status: 404,
                  statusText: 'Not Found',
                  headers: { 'Content-Type': 'text/plain' }
                });
              }
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('Network fetch failed or chunk unavailable', {
              status: 408,
              statusText: 'Request Timeout',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
    );
    return;
  }
});
