const CACHE = 'urban-canopy-v2';
const SHELL = ['/', '/manifest.webmanifest', '/cities/vancouver/manifest.json', '/cities/vancouver/trees.pack', '/assets/index.js', '/assets/index.css', '/assets/data.worker.js', '/assets/maplibre.js'];

self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))));
self.addEventListener('activate', event => event.waitUntil(clients.claim()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => hit ?? fetch(event.request).then(response => {
    if (new URL(event.request.url).origin === location.origin) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
