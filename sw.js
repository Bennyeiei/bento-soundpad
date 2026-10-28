// HTML and catalogue must stay fresh after a new library publication.
const CACHE_NAME = 'kkt-voice-v6-20261028';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => /^(bubble-voice-|kkt-voice-)/.test(key) && key !== CACHE_NAME)
      .map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || /\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(url.pathname)) return;
  event.respondWith(fetch(event.request, { cache: 'no-cache' }));
});
