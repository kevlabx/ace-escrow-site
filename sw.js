// Minimal offline cache for static assets
const V = 'ace-escrow-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/style.css',
  './assets/app.js',
  './assets/hero.jpg'      // ensure this exists
  // add './assets/hero@2x.jpg' if you upload it
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
