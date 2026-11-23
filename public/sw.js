const SW_VERSION = '{{SW_VERSION}}';
const SHELL_CACHE = `urban-canopy-shell-v2-${SW_VERSION}`;
const DATA_CACHE = 'urban-canopy-data-v2';
const SHELL = ['{{SHELL_ASSETS}}'];

const DATA = [
  '/cities/vancouver/manifest.json',
  '/cities/vancouver/vancouver.highlights.v2.1.0.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      // Stable bundle URLs may still have the previous release in the HTTP cache.
      caches.open(SHELL_CACHE).then(cache =>
        cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))
      ),
      caches.open(DATA_CACHE).then(cache => cache.addAll(DATA))
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== SHELL_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // External map tiles, styles, fonts, etc. must pass through untouched.
  if (url.origin !== location.origin) {
    return;
  }

  // HTML navigations: network-first, then cache fallback.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // City data: cache-first from the stable data cache.
  if (url.pathname.startsWith('/cities/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(cache =>
        cache.match(event.request).then(hit =>
          hit ?? fetch(event.request).then(response => {
            const clone = response.clone();
            cache.put(event.request, clone);
            return response;
          })
        )
      )
    );
    return;
  }

  // Precached public build files were stored by URL. Module requests can add
  // an Origin header that would otherwise miss that entry under Vary: Origin.
  const cacheKey = SHELL.includes(url.pathname) ? url.href : event.request;
  event.respondWith(
    caches.open(SHELL_CACHE).then(cache =>
      cache.match(cacheKey).then(hit =>
        hit ?? fetch(event.request).then(response => {
          const clone = response.clone();
          cache.put(cacheKey, clone);
          return response;
        })
      )
    )
  );
});
