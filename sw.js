// ══════════════════════════════════════════════
//  Estação – Service Worker v1
// ══════════════════════════════════════════════

const CACHE_NAME = 'estacao-v1';
const CACHE_VERSION = 1;

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
];

const BYPASS_DOMAINS = [
  'firebaseio.com',
  'firebasestorage.app',
  'firebaseapp.com',
  'gstatic.com',
  'googleapis.com',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Estação v' + CACHE_VERSION);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (
    BYPASS_DOMAINS.some((domain) =>
      url.hostname.includes(domain)
    )
  ) {
    return;
  }

  if (url.protocol === 'chrome-extension:') return;

  // HTML: tenta buscar a versão mais recente da rede.
  // Se estiver offline, utiliza a versão armazenada.
  if (
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) =>
                cache.put(event.request, copy)
              );
          }

          return response;
        })
        .catch(async () => {
          return (
            await caches.match(event.request) ||
            await caches.match('./index.html')
          );
        })
    );

    return;
  }

  // Demais arquivos: cache primeiro, rede depois.
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type === 'opaque'
            ) {
              return response;
            }

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) =>
                cache.put(event.request, copy)
              );

            return response;
          })
          .catch(() => {
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
