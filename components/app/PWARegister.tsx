'use client'

import { useEffect } from 'react'

export function getServiceWorkerUrl(): string {
  const version = process.env.NEXT_PUBLIC_APP_BUILD_VERSION?.trim() || 'dev'
  return `/sw.js?v=${encodeURIComponent(version)}`
}

async function clearDogeowCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  const cacheKeys = await caches.keys()
  await Promise.all(
    cacheKeys.filter(key => key.startsWith('dogeow-')).map(key => caches.delete(key))
  )
}

async function unregisterServiceWorkers() {
  if (
    !('serviceWorker' in navigator) ||
    typeof navigator.serviceWorker.getRegistrations !== 'function'
  ) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map(registration => registration.unregister()))
}

export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    // The previous PWA service worker could serve /offline for real navigations
    // after a transient CDN/network failure, leaving users stuck on
    // “正在检查网络...”. Disable SW interception for this site; browser/Next.js
    // networking is more reliable than an app-level offline fallback here.
    void unregisterServiceWorkers().catch(error => {
      console.warn('清理 Service Worker 注册失败:', error)
    })
    void clearDogeowCaches().catch(error => {
      console.warn('清理 DogeOW 缓存失败:', error)
    })
  }, [])

  return null
}
