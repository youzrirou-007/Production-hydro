const CACHE_NAME = 'hydromines-cache-v1';

// Assets to pre-cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install Event: Pre-cache core files and take over immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching failed, but Service Worker will still cache dynamically:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches and take control of all pages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Dynamic Caching Strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external API/Firebase endpoints to avoid interference
  if (request.method !== 'GET' || 
      url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle HTML navigation requests defensively for offline React Router (Bug 8 Fix)
  const isNavigate = request.mode === 'navigate' || 
                     (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));
  
  if (isNavigate) {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/index.html', responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/index.html').then((cachedIndex) => {
          return cachedIndex || caches.match('/');
        });
      })
    );
    return;
  }

  // Caching Strategy: Cache-First for assets, images, icons, and CSS/JS chunks
  const isStaticAsset = 
    url.pathname.includes('/assets/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|css|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache instantly (0KB network request)
          return cachedResponse;
        }

        // Fetch from network, cache it, then return
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Fallback if offline
          return new Response('Offline Asset Not Found', { status: 404, statusText: 'Offline' });
        });
      })
    );
  } else {
    // Network-First strategy with Cache Fallback for HTML/routing
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cache if network fails (e.g. offline)
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the page/route itself is not cached, return the root cached index.html
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        });
      })
    );
  }
});
