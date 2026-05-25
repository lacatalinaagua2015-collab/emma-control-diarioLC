// Service Worker — Emma Control
const CACHE = 'emma-control-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Para Firebase y APIs externas, siempre ir a la red
  if (e.request.url.includes('firebase') || 
      e.request.url.includes('googleapis') ||
      e.request.url.includes('gstatic')) {
    return;
  }
  // Para el resto, intentar red y si falla usar caché
  e.respondWith(
    fetch(e.request)
      .then(res => {
        var clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
