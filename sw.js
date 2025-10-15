const CACHE_NAME = 'bubble-voice-v1';
const CORE_ASSETS = ['./','./index.html','./manifest.webmanifest','./sounds.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isAudio = /\.(mp3|m4a|wav|ogg)$/i.test(url.pathname);
  if (isAudio) return; // ไม่แคชไฟล์เสียง
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(netRes => {
      if (e.request.method === 'GET' && netRes.ok && netRes.type === 'basic') {
        const copy = netRes.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
      }
      return netRes;
    }))
  );
});
