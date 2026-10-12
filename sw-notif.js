// ══════════════════════════════════════════════
//  Estação - Notificações Push v1
// ══════════════════════════════════════════════

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

// ══════════════════════════════════════════════
//  RECEBIMENTO DE NOTIFICAÇÕES
// ══════════════════════════════════════════════

self.addEventListener('push', function(e) {
  var data = {};

  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    data = {
      title: e.data ? e.data.text() : 'Notificação'
    };
  }

  // Ícone oficial do aplicativo Estação
  var iconUrl =
    'https://mocidadebairroestacao-jpg.github.io/AppEstacao/icon-192x192.png';

  e.waitUntil(
    self.registration.showNotification(
      data.title || 'Estação',
      {
        body: data.body || '',
        icon: iconUrl,
        badge: iconUrl,
        requireInteraction: true,
        tag: data.tag || 'estacao-evento',
        vibrate: [200, 100, 200]
      }
    )
  );
});

// ══════════════════════════════════════════════
//  CLIQUE NA NOTIFICAÇÃO
// ══════════════════════════════════════════════

self.addEventListener('notificationclick', function(e) {
  e.notification.close();

  e.waitUntil(
    self.clients.openWindow(
      'https://mocidadebairroestacao-jpg.github.io/AppEstacao/'
    )
  );
});
