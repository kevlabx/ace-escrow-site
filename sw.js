// Static cache
const V='ace-escrow-v6';
const ASSETS=[
  './',
  './index.html',
  './assets/style.css',
  './assets/app.js',
  './assets/hero.jpg',
  './assets/logo.png'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==V).map(k=>caches.delete(k)))));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
