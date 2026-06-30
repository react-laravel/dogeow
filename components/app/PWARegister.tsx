'use client'

import { useEffect } from 'react'
import { ensurePushServiceWorkerRegistered } from '@/lib/push/serviceWorker'

export { getPushServiceWorkerUrl as getServiceWorkerUrl } from '@/lib/push/serviceWorker'

export function PWARegister() {
  useEffect(() => {
    void ensurePushServiceWorkerRegistered().catch(error => {
      console.warn('注册 Push Service Worker 失败:', error)
    })
  }, [])

  return null
}
