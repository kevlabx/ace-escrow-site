// sw.js — American Classic Escrow
// Cache version bump forces updates after deploys.
const V = 'ace-escrow-v9';

const ASSETS = [
  './',
  './index.html',
  './assets/style.css',
  './assets/app.js',
  './assets/hero.jpg',
  './assets/logo.png'
];

// Precache core assets
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS)));
});

// Clean old caches and take control
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for navigations, cache-first for static assets
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // HTML navigations: prefer fresh, fall back to cached index
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(V).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin static files: cache-first
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          // Cache successful GET responses
          if (res && res.status === 200 && req.method === 'GET') {
            const copy = res.clone();
            caches.open(V).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
