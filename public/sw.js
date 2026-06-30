// DogeOW push-only service worker.
//
// Handles Web Push display/click only. Does not intercept navigations or serve
// offline fallbacks, so users won't get stuck on the old "正在检查网络..." page.

const LEGACY_CACHE_PREFIX = 'dogeow-'

async function clearLegacyCaches() {
  if (!self.caches) return
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(cacheName => cacheName.startsWith(LEGACY_CACHE_PREFIX))
      .map(cacheName => caches.delete(cacheName).catch(() => false))
  )
}

function parsePushPayload(event) {
  const fallback = {
    title: 'DogeOW',
    body: '',
    icon: '/480.png',
    badge: '/80.png',
    url: '/',
    tag: 'dogeow-notification',
  }

  if (!event.data) {
    return fallback
  }

  try {
    const payload = event.data.json()
    const data = payload.data && typeof payload.data === 'object' ? payload.data : {}

    return {
      title: payload.title || fallback.title,
      body: payload.body || fallback.body,
      icon: payload.icon || fallback.icon,
      badge: payload.badge || fallback.badge,
      url: data.url || payload.url || fallback.url,
      tag: payload.tag || fallback.tag,
      notificationId: data.notification_id || payload.notification_id || null,
    }
  } catch {
    return {
      ...fallback,
      body: event.data.text(),
    }
  }
}

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(clearLegacyCaches())
})

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([clearLegacyCaches(), self.clients.claim()]))
})

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('push', event => {
  const payload = parsePushPayload(event)

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      data: {
        url: payload.url,
        notification_id: payload.notificationId,
      },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'
  const absoluteUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(absoluteUrl).then(() => client.focus())
          }
          return client.focus()
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl)
      }

      return undefined
    })
  )
})
