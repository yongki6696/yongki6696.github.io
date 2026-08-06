// Service Worker for RSI Watch PWA
const CACHE_NAME = 'rsi-watch-v3';

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
  var url = e.request.url;

  // 야후 프록시 / Firebase(방문자수·채팅) 요청은 캐싱 대상에서 완전히 제외하고 네트워크로만 처리
  if (url.includes('finance.yahoo') || url.includes('allorigins') || url.includes('corsproxy') || url.includes('firebaseio.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', {headers:{'Content-Type':'application/json'}})));
    return;
  }

  // Cache API는 GET 요청만 지원하므로, GET이 아닌 요청(POST/PUT/DELETE 등)은 캐싱 시도 없이 그대로 네트워크로 처리
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(e.request, { cache: 'no-store' }).then(res => { cache.put(e.request, res.clone()); return res; })
        .catch(() => caches.match(e.request))
    )
  );
});
