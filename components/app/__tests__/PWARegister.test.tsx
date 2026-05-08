import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PWARegister } from '../PWARegister'

interface MockServiceWorkerContainer {
  addEventListener: ReturnType<typeof vi.fn>
  controller: { postMessage: ReturnType<typeof vi.fn> } | null
  getRegistration: ReturnType<typeof vi.fn>
  getRegistrations: ReturnType<typeof vi.fn>
  register: ReturnType<typeof vi.fn>
}

describe('PWARegister', () => {
  const originalServiceWorker = Object.getOwnPropertyDescriptor(
    Navigator.prototype,
    'serviceWorker'
  )
  const originalCaches = globalThis.caches

  let registrationUpdate: ReturnType<typeof vi.fn>
  let waitingPostMessage: ReturnType<typeof vi.fn>
  let controllerPostMessage: ReturnType<typeof vi.fn>
  let unregister: ReturnType<typeof vi.fn>
  let cacheDelete: ReturnType<typeof vi.fn>
  let mockServiceWorker: MockServiceWorkerContainer

  beforeEach(() => {
    vi.useFakeTimers()
    vi.unstubAllEnvs()

    registrationUpdate = vi.fn().mockResolvedValue(undefined)
    waitingPostMessage = vi.fn()
    controllerPostMessage = vi.fn()
    unregister = vi.fn().mockResolvedValue(true)
    cacheDelete = vi.fn().mockResolvedValue(true)

    const registration = {
      waiting: { postMessage: waitingPostMessage },
      installing: null,
      active: null,
      scope: '/',
      update: registrationUpdate,
      unregister,
      addEventListener: vi.fn(),
    } as unknown as ServiceWorkerRegistration

    mockServiceWorker = {
      addEventListener: vi.fn(),
      controller: { postMessage: controllerPostMessage },
      getRegistration: vi.fn().mockResolvedValue(registration),
      getRegistrations: vi.fn().mockResolvedValue([registration]),
      register: vi.fn().mockResolvedValue(registration),
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

  it('checks for updates immediately after registration', async () => {
    render(<PWARegister />)

    await waitFor(() => {
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
    })

    await waitFor(() => {
      expect(registrationUpdate).toHaveBeenCalledTimes(1)
    })
  })

  it('sends SKIP_WAITING to the waiting worker instead of the controller', async () => {
    render(<PWARegister />)

    const updateButton = await screen.findByRole('button', { name: '立即更新' })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(waitingPostMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    })
    expect(controllerPostMessage).not.toHaveBeenCalled()
  })

  it('unregisters local development service workers instead of registering a new one', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    render(<PWARegister />)

    await waitFor(() => {
      expect(mockServiceWorker.getRegistrations).toHaveBeenCalledTimes(1)
    })

    expect(unregister).toHaveBeenCalledTimes(1)
    expect(cacheDelete).toHaveBeenCalledWith('dogeow-v1.0.2')
    expect(cacheDelete).not.toHaveBeenCalledWith('third-party-cache')
    expect(mockServiceWorker.register).not.toHaveBeenCalled()
  })
})
