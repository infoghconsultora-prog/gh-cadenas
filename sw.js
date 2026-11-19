/* GH Cadenas — Copyright (c) 2026 Felipe Manrique. Todos los derechos reservados. */
// Cache de la cáscara para abrir sin señal. SUBIR VERSION EN CADA CAMBIO (si no, los teléfonos nunca lo reciben).
const VERSION = 'gh-cadenas-v1.6.1';
const PREFIJO = 'gh-cadenas-v';
const SHELL = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-32.png', 'icons/icon-maskable-512.png', 'apple-touch-icon.png', 'logo-gh.png', 'backend.js', 'cadenas.js', 'almacen.js', 'firma.js', 'pdf.js', 'plantillas-cc.js', 'pdf-original.js', 'demo.js', 'vendor/pdf-lib.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIJO) && k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Red primero (recibe actualizaciones), caché si no hay conexión.
// Solo GET del mismo origen: el backend (script.google.com) nunca se cachea.
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (/\.webmanifest$|\/icons\/|apple-touch-icon|oauth\.html$/.test(url.pathname)) return;
  e.respondWith(
    fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' })).then((res) => {   // revalida: nunca la copia vieja del navegador
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
