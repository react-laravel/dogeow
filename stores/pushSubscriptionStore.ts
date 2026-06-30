'use client'

import { create } from 'zustand'
import useAuthStore from '@/stores/authStore'
import {
  base64UrlToUint8Array,
  deletePushSubscription,
  getVapidPublicKey,
  savePushSubscription,
  subscriptionToPayload,
} from '@/lib/api/push'
import {
  ensurePushServiceWorkerRegistered,
  waitForPushServiceWorkerReady,
} from '@/lib/push/serviceWorker'

export type PushPermissionState = NotificationPermission | 'unsupported'
export type PushStatus = 'idle' | 'loading' | 'done' | 'error'

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

interface PushSubscriptionState {
  permission: PushPermissionState
  hasSubscription: boolean
  status: PushStatus
  errorMessage: string | null
  autoRegisterStarted: boolean
  refreshState: () => Promise<void>
  register: () => Promise<boolean>
  unregister: () => Promise<boolean>
  ensureAutoRegister: () => void
  reset: () => void
}

const initialState = {
  permission: 'default' as PushPermissionState,
  hasSubscription: false,
  status: 'idle' as PushStatus,
  errorMessage: null as string | null,
  autoRegisterStarted: false,
}

const usePushSubscriptionStore = create<PushSubscriptionState>((set, get) => ({
  ...initialState,

  reset: () => set({ ...initialState }),

  refreshState: async () => {
    if (!isPushSupported() || typeof Notification === 'undefined') {
      set({ permission: 'unsupported', hasSubscription: false })
      return
    }

    set({ permission: Notification.permission })

    if (Notification.permission !== 'granted' || !('serviceWorker' in navigator)) {
      set({ hasSubscription: false })
      return
    }

    try {
      await ensurePushServiceWorkerRegistered()
      const registration = await waitForPushServiceWorkerReady()
      const subscription = await registration.pushManager.getSubscription()
      set({ hasSubscription: Boolean(subscription) })
    } catch {
      set({ hasSubscription: false })
    }
  },

  register: async () => {
    if (!isPushSupported()) {
      set({ errorMessage: '当前环境不支持 Web Push', status: 'error' })
      return false
    }

    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) {
      set({ errorMessage: '请先登录', status: 'error' })
      return false
    }

    if (Notification.permission !== 'granted') {
      set({ errorMessage: '请先允许浏览器通知', status: 'error' })
      return false
    }

    if (get().status === 'loading') {
      return false
    }

    set({ status: 'loading', errorMessage: null })

    try {
      const [{ public_key: publicKey }, registration] = await Promise.all([
        getVapidPublicKey(),
        waitForPushServiceWorkerReady(),
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
      set({ status: 'done', hasSubscription: true, permission: 'granted' })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '订阅失败'
      set({ errorMessage: message, status: 'error', hasSubscription: false })
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Web Push 订阅失败:', err)
      }
      return false
    }
  },

  unregister: async () => {
    if (!isPushSupported()) {
      set({ errorMessage: '当前环境不支持 Web Push', status: 'error' })
      return false
    }

    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated) {
      set({ errorMessage: '请先登录', status: 'error' })
      return false
    }

    if (get().status === 'loading') {
      return false
    }

    set({ status: 'loading', errorMessage: null })

    try {
      await ensurePushServiceWorkerRegistered()
      const registration = await waitForPushServiceWorkerReady()
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        set({ status: 'done', hasSubscription: false })
        return true
      }

      await deletePushSubscription(subscription.endpoint)
      await subscription.unsubscribe()
      set({ status: 'done', hasSubscription: false })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '取消订阅失败'
      set({ errorMessage: message, status: 'error' })
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Web Push 取消订阅失败:', err)
      }
      return false
    }
  },

  ensureAutoRegister: () => {
    const { autoRegisterStarted, status } = get()
    if (autoRegisterStarted || status === 'loading') return

    const isAuthenticated = useAuthStore.getState().isAuthenticated
    if (!isAuthenticated || !isPushSupported()) return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return

    set({ autoRegisterStarted: true })

    void get()
      .refreshState()
      .then(() =>
        get()
          .register()
          .then(ok => {
            if (!ok && get().status === 'error') {
              set({ autoRegisterStarted: false, status: 'idle' })
            }
          })
      )
  },
}))

export default usePushSubscriptionStore
