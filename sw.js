// KKT Voice Guide service worker
const CACHE_NAME = 'kkt-voice-guide-v3';
const CORE_ASSETS = [
  './',
  './manifest.webmanifest',
  './data/jobs.json',
  './data/legacy-jobs.json',
  './src/styles/tokens.css',
  './src/styles/layout.css',
  './src/styles/components.css',
  './src/app.js',
  './src/audio.js',
  './src/data.js',
  './src/render.js',
  './src/router.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!['GET', 'HEAD'].includes(event.request.method)) return;
  if (/\.(mp3|m4a|wav|ogg)$/i.test(url.pathname)) return;

  const isCatalog = url.pathname.endsWith('/data/jobs.json') || url.pathname.endsWith('/data/legacy-jobs.json');
  if (isCatalog) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((response) => {
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fresh = fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => event.request.mode === 'navigate'
        ? caches.match('./')
        : Response.error());
      return cached || fresh;
    }),
  );
});
