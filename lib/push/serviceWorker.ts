'use client'

import { getNotificationPreferences, type NotificationPreferences } from './notificationPreferences'

export function getPushServiceWorkerUrl(): string {
  const version = process.env.NEXT_PUBLIC_APP_BUILD_VERSION?.trim() || 'dev'
  return `/sw.js?v=${encodeURIComponent(version)}`
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null
let notificationPreferencesSyncQueue = Promise.resolve()

const NOTIFICATION_PREFERENCES_ACK_TIMEOUT_MS = 2000

function postNotificationPreferencesToWorker(
  worker: ServiceWorker,
  preferences: NotificationPreferences
): Promise<void> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel()
    const timeoutId = window.setTimeout(() => {
      channel.port1.close()
      reject(new Error('Service Worker 保存通知声音设置超时'))
    }, NOTIFICATION_PREFERENCES_ACK_TIMEOUT_MS)

    const finish = (error?: Error) => {
      window.clearTimeout(timeoutId)
      channel.port1.close()
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    }

    channel.port1.onmessage = event => {
      if (event.data?.ok === true) {
        finish()
      } else {
        finish(new Error('Service Worker 未能保存通知声音设置'))
      }
    }

    try {
      worker.postMessage(
        {
          type: 'SET_NOTIFICATION_PREFERENCES',
          preferences,
        },
        [channel.port2]
      )
    } catch (error) {
      finish(error instanceof Error ? error : new Error('通知声音设置同步失败'))
    }
  })
}

async function postNotificationPreferences(
  registration: ServiceWorkerRegistration,
  preferences: NotificationPreferences
): Promise<void> {
  const workers = [
    registration.waiting,
    registration.installing,
    registration.active,
    navigator.serviceWorker.controller,
  ]
  const notifiedWorkers = new Set<ServiceWorker>()
  let lastError: Error | null = null

  for (const worker of workers) {
    if (!worker || notifiedWorkers.has(worker)) continue
    notifiedWorkers.add(worker)

    try {
      await postNotificationPreferencesToWorker(worker, preferences)
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('通知声音设置同步失败')
    }
  }

  throw lastError ?? new Error('没有可用的 Service Worker')
}

function enqueueNotificationPreferencesSync(
  registration: ServiceWorkerRegistration,
  preferences: NotificationPreferences
): Promise<void> {
  const sync = notificationPreferencesSyncQueue
    .catch(() => undefined)
    .then(() => postNotificationPreferences(registration, preferences))
  notificationPreferencesSyncQueue = sync
  return sync
}

async function clearLegacyDogeowCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  const cacheKeys = await caches.keys()
  await Promise.all(
    cacheKeys.filter(key => key.startsWith('dogeow-')).map(key => caches.delete(key))
  )
}

export async function ensurePushServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  if (!registrationPromise) {
    registrationPromise = (async () => {
      const scriptUrl = getPushServiceWorkerUrl()
      const existing = await navigator.serviceWorker.getRegistration('/')

      if (existing?.active?.scriptURL.includes('/sw.js')) {
        await existing.update().catch(() => undefined)
      } else {
        await navigator.serviceWorker.register(scriptUrl, {
          scope: '/',
          updateViaCache: 'none',
        })
      }

      const registration = await navigator.serviceWorker.ready

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      await clearLegacyDogeowCaches()
      void enqueueNotificationPreferencesSync(registration, getNotificationPreferences()).catch(
        () => undefined
      )
      return registration
    })().catch(error => {
      registrationPromise = null
      throw error
    })
  }

  return registrationPromise
}

export async function syncPushNotificationPreferences(
  preferences: NotificationPreferences
): Promise<void> {
  const registration = await ensurePushServiceWorkerRegistered()
  if (!registration) return

  await enqueueNotificationPreferencesSync(registration, preferences)
}

export async function waitForPushServiceWorkerReady(
  timeoutMs = 15000
): Promise<ServiceWorkerRegistration> {
  const registration = await ensurePushServiceWorkerRegistered()
  if (!registration) {
    throw new Error('当前环境不支持 Service Worker')
  }

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<ServiceWorkerRegistration>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('Service Worker 启动超时，请刷新页面后重试'))
      }, timeoutMs)
    }),
  ])
}

export function resetPushServiceWorkerRegistrationForTests(): void {
  registrationPromise = null
  notificationPreferencesSyncQueue = Promise.resolve()
}
