import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ensurePushServiceWorkerRegistered,
  getPushServiceWorkerUrl,
  resetPushServiceWorkerRegistrationForTests,
} from '../serviceWorker'

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
    const register = vi.fn().mockResolvedValue({ scope: '/', waiting: null })
    const update = vi.fn().mockResolvedValue(undefined)
    const getRegistration = vi.fn().mockResolvedValue(null)

    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: {
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
    expect(registration).toEqual({ scope: '/', waiting: null, update })
  })
})
