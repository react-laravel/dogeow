// DogeOW push-only service worker.
//
// Handles Web Push display/click only. Does not intercept navigations or serve
// offline fallbacks, so users won't get stuck on the old "正在检查网络..." page.

const LEGACY_CACHE_PREFIX = 'dogeow-'
const NOTIFICATION_PREFERENCES_CACHE = 'push-notification-preferences-v1'
const NOTIFICATION_PREFERENCES_URL = new URL(
  '/__push-notification-preferences__',
  self.location.origin
).href
const DEFAULT_NOTIFICATION_PREFERENCES = {
  soundEnabled: true,
  quietHoursStart: 22,
  quietHoursEnd: 9,
}

async function clearLegacyCaches() {
  if (!self.caches) return
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(cacheName => cacheName.startsWith(LEGACY_CACHE_PREFIX))
      .map(cacheName => caches.delete(cacheName).catch(() => false))
  )
}

function normalizeNotificationPreferences(preferences) {
  return {
    soundEnabled: preferences?.soundEnabled !== false,
    quietHoursStart: normalizeHour(
      preferences?.quietHoursStart,
      DEFAULT_NOTIFICATION_PREFERENCES.quietHoursStart
    ),
    quietHoursEnd: normalizeHour(
      preferences?.quietHoursEnd,
      DEFAULT_NOTIFICATION_PREFERENCES.quietHoursEnd
    ),
  }
}

function normalizeHour(value, fallback) {
  return Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback
}

async function readNotificationPreferences() {
  if (!self.caches) return DEFAULT_NOTIFICATION_PREFERENCES

  try {
    const cache = await caches.open(NOTIFICATION_PREFERENCES_CACHE)
    const response = await cache.match(NOTIFICATION_PREFERENCES_URL)
    if (!response) return DEFAULT_NOTIFICATION_PREFERENCES

    return normalizeNotificationPreferences(await response.json())
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
}

async function writeNotificationPreferences(preferences) {
  if (!self.caches) {
    throw new Error('Cache Storage is unavailable')
  }

  const cache = await caches.open(NOTIFICATION_PREFERENCES_CACHE)
  const normalizedPreferences = normalizeNotificationPreferences(preferences)
  await cache.put(
    NOTIFICATION_PREFERENCES_URL,
    new Response(JSON.stringify(normalizedPreferences), {
      headers: { 'content-type': 'application/json' },
    })
  )
}

function isQuietHours(preferences, date = new Date()) {
  const hour = date.getHours()
  const { quietHoursStart: start, quietHoursEnd: end } = preferences

  if (start === end) return false
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

function shouldSilenceNotification(preferences, date = new Date()) {
  return preferences.soundEnabled === false || isQuietHours(preferences, date)
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

  if (event.data?.type === 'SET_NOTIFICATION_PREFERENCES') {
    const responsePort = event.ports?.[0]
    const persistPreferences = writeNotificationPreferences(event.data.preferences)
      .then(() => {
        responsePort?.postMessage({ ok: true })
      })
      .catch(error => {
        responsePort?.postMessage({ ok: false })
        throw error
      })

    event.waitUntil(persistPreferences)
  }
})

self.addEventListener('push', event => {
  const payload = parsePushPayload(event)

  event.waitUntil(
    readNotificationPreferences().then(preferences => {
      const silent = shouldSilenceNotification(preferences)

      return self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        tag: payload.tag,
        data: {
          url: payload.url,
          notification_id: payload.notificationId,
        },
        ...(silent ? { silent: true } : {}),
      })
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'
  const absoluteUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clientList => {
      const matchingClient = clientList.find(client => client.url === absoluteUrl)
      if (matchingClient && 'focus' in matchingClient) {
        return matchingClient.focus()
      }

      for (const client of clientList) {
        if ('focus' in client && 'navigate' in client && typeof client.navigate === 'function') {
          try {
            await client.navigate(absoluteUrl)
            return client.focus()
          } catch {
            // Safari/iOS 可能不支持导航现有 PWA 窗口，继续尝试 openWindow。
          }
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl)
      }

      const focusableClient = clientList.find(client => 'focus' in client)
      if (focusableClient) {
        return focusableClient.focus()
      }

      return undefined
    })
  )
})
