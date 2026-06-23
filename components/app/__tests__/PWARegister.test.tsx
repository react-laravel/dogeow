import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServiceWorkerUrl, PWARegister } from '../PWARegister'

interface MockServiceWorkerContainer {
  addEventListener: ReturnType<typeof vi.fn>
  controller: { postMessage: ReturnType<typeof vi.fn> } | null
  getRegistration: ReturnType<typeof vi.fn>
  getRegistrations: ReturnType<typeof vi.fn>
}

describe('PWARegister', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    'serviceWorker'
  )
  const originalCaches = globalThis.caches

  let registrationUpdate: ReturnType<typeof vi.fn>
  let unregister: ReturnType<typeof vi.fn>
  let cacheDelete: ReturnType<typeof vi.fn>
  let mockServiceWorker: MockServiceWorkerContainer

  beforeEach(() => {
    vi.useFakeTimers()
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_VERSION', 'test-build-20260512')

    registrationUpdate = vi.fn().mockResolvedValue(undefined)
    unregister = vi.fn().mockResolvedValue(true)
    cacheDelete = vi.fn().mockResolvedValue(true)

    const registration = {
      waiting: null,
      installing: null,
      active: null,
      scope: '/',
      update: registrationUpdate,
      unregister,
      addEventListener: vi.fn(),
    } as unknown as ServiceWorkerRegistration

    mockServiceWorker = {
      addEventListener: vi.fn(),
      controller: null,
      getRegistration: vi.fn().mockResolvedValue(registration),
      getRegistrations: vi.fn().mockResolvedValue([registration]),
    }

    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: mockServiceWorker,
    })

    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: {
        delete: cacheDelete,
        keys: vi.fn().mockResolvedValue(['dogeow-v1.0.2', 'third-party-cache']),
      },
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()

    if (originalServiceWorker) {
      Object.defineProperty(Navigator.prototype, 'serviceWorker', originalServiceWorker)
    }

    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: originalCaches,
    })
  })

  it('builds a versioned service worker URL', () => {
    expect(getServiceWorkerUrl()).toBe('/sw.js?v=test-build-20260512')
  })

  it('unregisters existing service workers and clears DogeOW caches', async () => {
    render(<PWARegister />)

    await waitFor(() => {
      expect(mockServiceWorker.getRegistrations).toHaveBeenCalledTimes(1)
    })

    expect(unregister).toHaveBeenCalledTimes(1)
    expect(cacheDelete).toHaveBeenCalledWith('dogeow-v1.0.2')
    expect(cacheDelete).not.toHaveBeenCalledWith('third-party-cache')
    expect(registrationUpdate).not.toHaveBeenCalled()
  })

  it('does nothing when service workers are unavailable', () => {
    Object.defineProperty(Navigator.prototype, 'serviceWorker', {
      configurable: true,
      value: undefined,
    })

    render(<PWARegister />)

    expect(mockServiceWorker.getRegistrations).not.toHaveBeenCalled()
  })
})
