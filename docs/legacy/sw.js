// sw.js
const CACHE_NAME = 'bubble-voice-v5';  // เปลี่ยนชื่อทุกครั้งที่แก้ SW
const CORE_ASSETS = [
  './',
  './manifest.webmanifest'
  // ไม่แคช './index.html' เพื่อลดโอกาสค้างหน้าเก่า
];

// ติดตั้ง
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

// เปิดใช้งาน
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// จัดนโยบายแคช
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 1) เสียง: ไม่แคช ปล่อยโหลดสด
  if (/\.(mp3|m4a|wav|ogg)$/i.test(url.pathname)) return;

  // 2) sounds.json: network-first (สดก่อน ถ้าออฟไลน์ค่อยใช้แคช)
  if (url.pathname.endsWith('/sounds.json')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 3) อื่น ๆ : cache-first + ใส่แคชภายหลัง (stale-while-revalidate แบบง่าย)
  e.respondWith(
    caches.match(e.request).then(res => {
      const fetchPromise = fetch(e.request).then(netRes => {
        if (e.request.method === 'GET' && netRes.ok && netRes.type === 'basic') {
          const copy = netRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }
        return netRes;
      });
      return res || fetchPromise;
    })
  );
});
