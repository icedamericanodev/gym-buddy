/* Herlyft service worker — offline support for the app shell.
 *
 * Strategy:
 *   - Navigations / HTML: network-first, falling back to cache. This guarantees
 *     a new deploy reaches users instead of trapping them on a stale build.
 *   - Other same-origin GETs (icons, manifest): stale-while-revalidate.
 *
 * Bump CACHE on every release so old caches are cleaned up on activate.
 */
const CACHE = 'herlyft-v1.1.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first for navigations so deploys propagate; cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Only cache a good response — never let a 404/500 error page
          // overwrite the cached app shell (mirrors the asset branch below).
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Stale-while-revalidate for same-origin static assets.
  // Skip non-http(s) schemes: the progress-photo gallery loads images from
  // per-render `blob:` URLs (same origin) that are revoked on the next render,
  // so caching them would only litter the cache with dead, unservable entries.
  const url = new URL(req.url);
  if ((url.protocol === 'http:' || url.protocol === 'https:') && url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
