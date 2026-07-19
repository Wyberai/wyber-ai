// v2 — static assets ONLY.
// v1 intercepted and cache.put() a clone of EVERY GET response, including
// React's streamed HTML/RSC payloads. Cloning a streaming navigation response
// ties the page's stream to the cache write's backpressure — when the write
// stalled, the tail of the stream (React's Suspense completion scripts) never
// arrived and the page rendered as a hidden <div id="S:x"> = a blank editor.
// It also cached authenticated pages under a never-versioned cache name that
// survived deploys. A service worker for this app must NEVER touch
// navigations, HTML, or RSC — hashed immutable build assets + icons only.
// v3 — cache-name bump purges v2 caches that may hold dev-mode chunks (dev
// chunk names are path-stable, so v2 could pin stale CSS/JS; registration is
// now production-only, see PlatformChrome).
const CACHE = 'wyberai-v3';
const STATIC_ASSETS = ['/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // Navigations, HTML, and RSC flight requests go straight to the network —
  // the browser handles them natively; we never respondWith() for these.
  if (e.request.mode === 'navigate') return;
  if (url.searchParams.has('_rsc')) return;

  const isHashedBuildAsset = url.pathname.startsWith('/_next/static/');
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname);
  if (!isHashedBuildAsset && !isStaticAsset) return;

  // Cache-first is safe here: /_next/static/* filenames are content-hashed
  // (immutable across deploys), and the icons/manifest change essentially never.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(cache => cache.put(e.request, c)); }
      return r;
    }))
  );
});
