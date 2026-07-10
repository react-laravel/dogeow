import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

interface NotificationClickEvent {
  notification: {
    close: ReturnType<typeof vi.fn>
    data: { url?: string }
  }
  waitUntil: (promise: Promise<unknown>) => void
}

function loadNotificationClickHandler(clients: {
  matchAll: ReturnType<typeof vi.fn>
  openWindow?: ReturnType<typeof vi.fn>
}) {
  const handlers = new Map<string, (event: NotificationClickEvent) => void>()
  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
  const serviceWorker = {
    location: { origin: 'https://dogeow.com' },
    caches: null,
    clients,
    registration: { showNotification: vi.fn() },
    skipWaiting: vi.fn(),
    addEventListener: vi.fn((type: string, handler: (event: NotificationClickEvent) => void) =>
      handlers.set(type, handler)
    ),
  }

  runInNewContext(source, {
    URL,
    caches: { keys: vi.fn() },
    self: serviceWorker,
  })

  const handler = handlers.get('notificationclick')
  if (!handler) {
    throw new Error('notificationclick handler was not registered')
  }

  return handler
}

async function dispatchNotificationClick(
  handler: (event: NotificationClickEvent) => void,
  url = '/'
): Promise<void> {
  let pending: Promise<unknown> | undefined
  handler({
    notification: {
      close: vi.fn(),
      data: { url },
    },
    waitUntil: promise => {
      pending = promise
    },
  })

  await pending
}

describe('push service worker notification click', () => {
  it('opens the target URL instead of focusing an unrelated iOS window', async () => {
    const focus = vi.fn()
    const openWindow = vi.fn().mockResolvedValue(undefined)
    const handler = loadNotificationClickHandler({
      matchAll: vi.fn().mockResolvedValue([{ url: 'https://dogeow.com/chat', focus }]),
      openWindow,
    })

    await dispatchNotificationClick(handler)

    expect(openWindow).toHaveBeenCalledWith('https://dogeow.com/')
    expect(focus).not.toHaveBeenCalled()
  })

  it('navigates and focuses an existing window when supported', async () => {
    const focus = vi.fn().mockResolvedValue(undefined)
    const navigate = vi.fn().mockResolvedValue(undefined)
    const openWindow = vi.fn()
    const handler = loadNotificationClickHandler({
      matchAll: vi.fn().mockResolvedValue([{ url: 'https://dogeow.com/chat', focus, navigate }]),
      openWindow,
    })

    await dispatchNotificationClick(handler, '/dashboard')

    expect(navigate).toHaveBeenCalledWith('https://dogeow.com/dashboard')
    expect(focus).toHaveBeenCalledOnce()
    expect(openWindow).not.toHaveBeenCalled()
  })
})
