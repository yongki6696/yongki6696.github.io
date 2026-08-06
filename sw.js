// Service Worker for RSI Watch PWA
const CACHE_NAME = 'rsi-watch-v2';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      )
    ])
  );
});

// 네트워크 우선, 실패 시 캐시 (브라우저 HTTP 캐시까지 우회해서 항상 최신 파일을 받아옴)
self.addEventListener('fetch', e => {
  if (e.request.url.includes('finance.yahoo') || e.request.url.includes('allorigins') || e.request.url.includes('corsproxy')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(e.request, { cache: 'no-store' }).then(res => { cache.put(e.request, res.clone()); return res; })
        .catch(() => caches.match(e.request))
    )
  );
});
