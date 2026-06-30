'use client'

export function getPushServiceWorkerUrl(): string {
  const version = process.env.NEXT_PUBLIC_APP_BUILD_VERSION?.trim() || 'dev'
  return `/sw.js?v=${encodeURIComponent(version)}`
}

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

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
      return registration
    })().catch(error => {
      registrationPromise = null
      throw error
    })
  }

  return registrationPromise
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
}
