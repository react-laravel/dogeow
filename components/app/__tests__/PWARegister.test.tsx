import { render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getServiceWorkerUrl, PWARegister } from '../PWARegister'

const { mockEnsurePushServiceWorkerRegistered } = vi.hoisted(() => ({
  mockEnsurePushServiceWorkerRegistered: vi.fn(),
}))

vi.mock('@/lib/push/serviceWorker', () => ({
  getPushServiceWorkerUrl: vi.fn(() => '/sw.js?v=test-build-20260512'),
  ensurePushServiceWorkerRegistered: mockEnsurePushServiceWorkerRegistered,
}))

describe('PWARegister', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_BUILD_VERSION', 'test-build-20260512')
    mockEnsurePushServiceWorkerRegistered.mockResolvedValue({
      scope: '/',
      active: { scriptURL: 'http://localhost/sw.js?v=test-build-20260512' },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('builds a versioned service worker URL', () => {
    expect(getServiceWorkerUrl()).toBe('/sw.js?v=test-build-20260512')
  })

  it('registers the push service worker on mount', async () => {
    render(<PWARegister />)

    await waitFor(() => {
      expect(mockEnsurePushServiceWorkerRegistered).toHaveBeenCalledTimes(1)
    })
  })
})
