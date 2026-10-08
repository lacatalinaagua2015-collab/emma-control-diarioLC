// Service Worker de Emma Control (comercial) — estrategia "red primero, caché como respaldo".
// Bumpear este número cada vez que se sube una nueva versión de index.html:
// fuerza a activar el SW nuevo enseguida (skipWaiting) sin esperar a que se cierren pestañas viejas.
const CACHE_NAME = 'emma-control-comercial-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Firebase (Auth/Firestore) y APIs externas nunca se cachean: siempre tienen que ir a la red
  // para que los datos y la sesión sean siempre los reales, no una copia vieja.
  const url = event.request.url;
  if (url.includes('firestore.googleapis.com') || url.includes('firebaseio.com') ||
      url.includes('googleapis.com') || url.includes('identitytoolkit')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Con conexión: siempre se usa la respuesta de red (la más nueva),
        // y de paso se guarda una copia como respaldo para el modo sin conexión.
        const copia = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia)).catch(() => {});
        return res;
      })
      .catch(() =>
        // Sin conexión: se sirve la última copia guardada, si existe.
        caches.match(event.request).then((cached) => cached || Promise.reject('offline y sin caché'))
      )
  );
});
