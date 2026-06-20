// DogeOW service worker kill-switch.
//
// The former PWA service worker cached /offline and intercepted navigations.
// After transient CDN/network failures, some browsers stayed stuck on the
// offline page: “正在检查网络... 请稍候”. Keep this file as a no-op unregistering
// service worker so existing registrations update, delete old DogeOW caches,
// and stop controlling future navigations.

const DISABLED_CACHE_PREFIX = 'dogeow-'

async function clearDogeowCaches() {
  if (!self.caches) return
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(cacheName => cacheName.startsWith(DISABLED_CACHE_PREFIX))
      .map(cacheName => caches.delete(cacheName).catch(() => false))
  )
}

async function unregisterSelf() {
  await clearDogeowCaches()
  await self.registration.unregister()
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  for (const client of clients) {
    client.postMessage({ type: 'SW_DISABLED' })
  }
}

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(clearDogeowCaches())
})

self.addEventListener('activate', event => {
  event.waitUntil(unregisterSelf())
})

// Do not call event.respondWith(). Every request must go directly to network/
// browser HTTP cache, never through a DogeOW SW fallback.
self.addEventListener('fetch', () => {})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING' || event.data?.type === 'DISABLE_SW') {
    self.skipWaiting()
  }
})
