const CACHE = 'aventura-elementais-v25';

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  await cache.addAll(['/manifest.webmanifest', '/icon.svg']);
  await self.skipWaiting();
})()));

self.addEventListener('activate', event => event.waitUntil((async () => {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames
    .filter(name => name.startsWith('aventura-elementais-') && name !== CACHE)
    .map(name => caches.delete(name)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  const alwaysFresh = event.request.mode === 'navigate'
    || url.pathname === '/'
    || url.pathname === '/index.html'
    || url.pathname === '/sw.js'
    || url.pathname.startsWith('/src/')
    || url.pathname.startsWith('/@vite/')
    || url.pathname.startsWith('/node_modules/');

  if (alwaysFresh) {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' }))
      .catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(fetch(event.request).then(async response => {
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(event.request, response.clone());
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
