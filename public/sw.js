// ─── Leasio Service Worker ────────────────────────────────────────────────────
// Strategy:
//   • App shell (JS/CSS/HTML) → Cache first, update in background
//   • Supabase / Razorpay API → Network first, no cache
//   • Images (Cloudinary) → Cache first, long TTL
//   • Offline fallback → Show cached shell or offline page

const CACHE_NAME    = 'leasio-v1';
const API_ORIGINS   = ['supabase.co', 'razorpay.com', 'checkout.razorpay.com'];
const IMG_ORIGINS   = ['res.cloudinary.com', 'cloudinary.com'];

// Files to pre-cache on install (Vite build output)
const PRECACHE_URLS = ['/', '/index.html'];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate — clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API calls — network first, no cache
  if (API_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(fetch(request).catch(() => new Response('{}', { headers: {'Content-Type':'application/json'} })));
    return;
  }

  // Images — cache first, fallback to network, cache the result
  if (IMG_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // App shell — stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => cached); // offline: serve cache

      return cached || fetchPromise;
    })
  );
});

// ── Push Notifications (future) ───────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Leasio', {
      body:  data.body  || '',
      icon:  '/icons/icon-192.png',
      badge: '/icons/favicon-32.png',
      data:  { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
