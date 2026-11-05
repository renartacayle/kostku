const CACHE_NAME = 'kostku-cache-v142';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
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

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Skip caching for non-GET, API routes, binary downloads, or WebSocket
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/downloads') ||
    url.pathname.startsWith('/download') ||
    url.pathname.startsWith('/unduh')
  ) {
    return;
  }

  // 2. Navigation / HTML Document requests: ALWAYS Network-First
  // Ensures user always gets the latest bundle without stale cache traps
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
          // Offline fallback
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // 3. Static Assets: Validated Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Validate cached response: If it's a JS/CSS file, ensure it is NOT poisoned with text/html
      let validCachedResponse = cachedResponse;
      if (validCachedResponse) {
        const cachedType = validCachedResponse.headers.get('content-type') || '';
        if ((url.pathname.endsWith('.js') || url.pathname.includes('/assets/')) && cachedType.includes('text/html')) {
          // Stale cache poisoned with HTML SPA fallback! Delete immediately
          caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
          validCachedResponse = undefined;
        }
      }

      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // Critical safeguard: NEVER cache HTML responses for JS or CSS requests!
            // When an SPA server rewrites missing chunks to index.html, caching it bricks dynamic imports.
            if ((url.pathname.endsWith('.js') || url.pathname.includes('/assets/')) && contentType.includes('text/html')) {
              console.warn('[KostKu SW] Rejected caching HTML response for chunk:', url.pathname);
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
        .catch(() => validCachedResponse);

      return validCachedResponse || fetchPromise;
    })
  );
});
