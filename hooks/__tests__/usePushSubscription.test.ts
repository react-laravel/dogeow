import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePushSubscription } from '../usePushSubscription'
import useAuthStore from '@/stores/authStore'
import { getVapidPublicKey, savePushSubscription, subscriptionToPayload } from '@/lib/api/push'

vi.mock('@/lib/api/push', () => ({
  base64UrlToUint8Array: vi.fn((value: string) =>
    value === 'new-key' ? new Uint8Array([4, 5, 6]) : new Uint8Array([1, 2, 3])
  ),
  getVapidPublicKey: vi.fn(),
  savePushSubscription: vi.fn(),
  subscriptionToPayload: vi.fn(subscription => ({
    endpoint: subscription.endpoint,
    keys: { p256dh: 'p256dh', auth: 'auth' },
  })),
}))

function createSubscription(endpoint: string, keyBytes: number[]) {
  return {
    endpoint,
    options: {
      applicationServerKey: new Uint8Array(keyBytes).buffer,
    },
    getKey: vi.fn(),
    unsubscribe: vi.fn(async () => true),
  } as unknown as PushSubscription
}

function installPushEnvironment(pushManager: PushManager) {
  Object.defineProperty(window, 'PushManager', {
    configurable: true,
    value: function PushManager() {},
  })
  Object.defineProperty(globalThis, 'PushManager', {
    configurable: true,
    value: function PushManager() {},
  })
  Object.defineProperty(window.Notification, 'permission', {
    configurable: true,
    value: 'granted',
  })
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager }),
    },
  })
}

describe('usePushSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      user: { id: 1, name: 'Sam', email: 'sam@example.com' },
      token: 'token',
      loading: false,
      isAuthenticated: true,
    })
    vi.mocked(getVapidPublicKey).mockResolvedValue({ public_key: 'existing-key' })
    vi.mocked(savePushSubscription).mockResolvedValue({ message: 'ok' })
  })

  it('saves an existing matching subscription instead of resubscribing', async () => {
    const existingSubscription = createSubscription('https://push.example/existing', [1, 2, 3])
    const pushManager = {
      getSubscription: vi.fn(async () => existingSubscription),
      subscribe: vi.fn(),
    } as unknown as PushManager
    installPushEnvironment(pushManager)

    const { result } = renderHook(() => usePushSubscription())
    const registered = await act(() => result.current.register())

    expect(registered).toBe(true)
    expect(pushManager.getSubscription).toHaveBeenCalled()
    expect(pushManager.subscribe).not.toHaveBeenCalled()
    expect(subscriptionToPayload).toHaveBeenCalledWith(existingSubscription)
    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: 'https://push.example/existing',
      keys: { p256dh: 'p256dh', auth: 'auth' },
    })
  })

  it('resubscribes when the existing subscription uses a stale application server key', async () => {
    vi.mocked(getVapidPublicKey).mockResolvedValue({ public_key: 'new-key' })
    const existingSubscription = createSubscription('https://push.example/stale', [1, 2, 3])
    const freshSubscription = createSubscription('https://push.example/fresh', [4, 5, 6])
    const pushManager = {
      getSubscription: vi.fn(async () => existingSubscription),
      subscribe: vi.fn(async () => freshSubscription),
    } as unknown as PushManager
    installPushEnvironment(pushManager)

    const { result } = renderHook(() => usePushSubscription())
    const registered = await act(() => result.current.register())

    expect(registered).toBe(true)
    expect(existingSubscription.unsubscribe).toHaveBeenCalled()
    expect(pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: new Uint8Array([4, 5, 6]),
    })
    expect(savePushSubscription).toHaveBeenCalledWith({
      endpoint: 'https://push.example/fresh',
      keys: { p256dh: 'p256dh', auth: 'auth' },
    })
  })

  it('automatically registers after permission has already been granted', async () => {
    const existingSubscription = createSubscription('https://push.example/auto', [1, 2, 3])
    const pushManager = {
      getSubscription: vi.fn(async () => existingSubscription),
      subscribe: vi.fn(),
    } as unknown as PushManager
    installPushEnvironment(pushManager)

    renderHook(() => usePushSubscription())

    await waitFor(() => {
      expect(savePushSubscription).toHaveBeenCalledWith({
        endpoint: 'https://push.example/auto',
        keys: { p256dh: 'p256dh', auth: 'auth' },
      })
    })
  })
})
