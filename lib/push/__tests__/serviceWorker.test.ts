import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensurePushServiceWorkerRegistered,
  getPushServiceWorkerUrl,
  resetPushServiceWorkerRegistrationForTests,
  syncPushNotificationPreferences,
} from '../serviceWorker'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../notificationPreferences'

describe('push service worker helpers', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    'serviceWorker'
  )

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_VERSION', 'test-build')
    resetPushServiceWorkerRegistrationForTests()
  })

  afterEach(() => {
    resetPushServiceWorkerRegistrationForTests()
    vi.restoreAllMocks()
    if (originalServiceWorker) {
      Object.defineProperty(Navigator.prototype, 'serviceWorker', originalServiceWorker)
    }
  })

  it('builds a versioned service worker URL', () => {
    expect(getPushServiceWorkerUrl()).toBe('/sw.js?v=test-build')
  })

  it('registers the push service worker when none exists', async () => {
    const postMessage = vi.fn((_message: unknown, ports: Transferable[]) => {
      const responsePort = ports[0] as MessagePort
      responsePort.postMessage({ ok: true })
    })
    const register = vi.fn().mockResolvedValue({ scope: '/', waiting: null })
    const update = vi.fn().mockResolvedValue(undefined)
    const getRegistration = vi.fn().mockResolvedValue(null)

    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: {
        controller: { postMessage },
        register,
        ready: Promise.resolve({ scope: '/', waiting: null, update }),
        getRegistration,
      },
    })

    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: {
        keys: vi.fn().mockResolvedValue(['dogeow-old']),
        delete: vi.fn().mockResolvedValue(true),
      },
    })

    const registration = await ensurePushServiceWorkerRegistered()

    expect(register).toHaveBeenCalledWith('/sw.js?v=test-build', {
      scope: '/',
      updateViaCache: 'none',
    })
    await vi.waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith(
        {
          type: 'SET_NOTIFICATION_PREFERENCES',
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        },
        [expect.any(MessagePort)]
      )
    })
    expect(registration).toEqual({ scope: '/', waiting: null, update })
  })

  it('waits for the service worker to confirm preference persistence', async () => {
    const postMessage = vi.fn((_message: unknown, ports: Transferable[]) => {
      const responsePort = ports[0] as MessagePort
      responsePort.postMessage({ ok: true })
    })
    const registration = {
      scope: '/',
      waiting: null,
      installing: null,
      active: { postMessage },
    }

    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        register: vi.fn(),
        ready: Promise.resolve(registration),
        getRegistration: vi.fn().mockResolvedValue({
          active: { scriptURL: 'https://dogeow.com/sw.js' },
          update: vi.fn().mockResolvedValue(undefined),
        }),
      },
    })

    await ensurePushServiceWorkerRegistered()
    const preferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      soundEnabled: false,
      quietHoursStart: 23,
    }
    await expect(syncPushNotificationPreferences(preferences)).resolves.toBeUndefined()
    expect(postMessage).toHaveBeenLastCalledWith(
      {
        type: 'SET_NOTIFICATION_PREFERENCES',
        preferences,
      },
      [expect.any(MessagePort)]
    )
  })

  it('surfaces a failed preference persistence acknowledgement', async () => {
    const postMessage = vi.fn((_message: unknown, ports: Transferable[]) => {
      const responsePort = ports[0] as MessagePort
      responsePort.postMessage({ ok: false })
    })
    const registration = {
      scope: '/',
      waiting: null,
      installing: null,
      active: { postMessage },
    }

    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: {
        controller: null,
        register: vi.fn(),
        ready: Promise.resolve(registration),
        getRegistration: vi.fn().mockResolvedValue({
          active: { scriptURL: 'https://dogeow.com/sw.js' },
          update: vi.fn().mockResolvedValue(undefined),
        }),
      },
    })

    await ensurePushServiceWorkerRegistered()
    await expect(
      syncPushNotificationPreferences({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        soundEnabled: false,
      })
    ).rejects.toThrow('Service Worker 未能保存通知声音设置')
  })
})
