'use client'

import { useCallback, useEffect, useState } from 'react'
import useAuthStore from '@/stores/authStore'
import {
  base64UrlToUint8Array,
  getVapidPublicKey,
  savePushSubscription,
  subscriptionToPayload,
} from '@/lib/api/push'

/**
 * 是否支持 Web Push（Service Worker + PushManager + Notification）
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function bufferEquals(left: ArrayBuffer | null, right: Uint8Array): boolean {
  if (!left || left.byteLength !== right.byteLength) return false

  const leftBytes = new Uint8Array(left)
  for (let index = 0; index < leftBytes.length; index += 1) {
    if (leftBytes[index] !== right[index]) return false
  }

  return true
}

function subscriptionMatchesApplicationServerKey(
  subscription: PushSubscription,
  applicationServerKey: Uint8Array
): boolean {
  return bufferEquals(subscription.options.applicationServerKey, applicationServerKey)
}

/**
 * 在用户已登录且已授权通知时，向服务端注册当前设备的推送订阅。
 * 可在 PWA 安装后或用户开启「浏览器通知」后调用。
 */
export function usePushSubscription() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const register = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setErrorMessage('当前环境不支持 Web Push')
      setStatus('error')
      return false
    }
    if (!isAuthenticated) {
      setErrorMessage('请先登录')
      setStatus('error')
      return false
    }
    if (Notification.permission !== 'granted') {
      setErrorMessage('请先允许浏览器通知')
      setStatus('error')
      return false
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const [{ public_key: publicKey }, registration] = await Promise.all([
        getVapidPublicKey(),
        navigator.serviceWorker.ready,
      ])

      if (!publicKey) {
        throw new Error('服务端未返回 VAPID 公钥')
      }

      const applicationServerKey = base64UrlToUint8Array(publicKey)
      const existingSubscription = await registration.pushManager.getSubscription()
      const subscription =
        existingSubscription &&
        subscriptionMatchesApplicationServerKey(existingSubscription, applicationServerKey)
          ? existingSubscription
          : await (async () => {
              if (existingSubscription) {
                await existingSubscription.unsubscribe()
              }

              return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as BufferSource,
              })
            })()

      const payload = subscriptionToPayload(subscription)
      await savePushSubscription(payload)
      setStatus('done')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '订阅失败'
      setErrorMessage(message)
      setStatus('error')
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Web Push 订阅失败:', err)
      }
      return false
    }
  }, [isAuthenticated])

  // 当用户已登录且已授权通知时，自动尝试注册一次（静默，不打扰用户）
  useEffect(() => {
    if (!isAuthenticated || status !== 'idle' || !isPushSupported()) return
    if (Notification.permission !== 'granted') return

    let cancelled = false
    register().then(ok => {
      if (cancelled) return
      if (!ok) setStatus('idle')
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, register, status])

  return {
    register,
    isSupported: isPushSupported(),
    status,
    errorMessage,
  }
}
