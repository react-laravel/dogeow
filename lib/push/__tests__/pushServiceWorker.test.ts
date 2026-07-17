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

interface PushEvent {
  data: {
    json: () => Record<string, unknown>
    text: () => string
  }
  waitUntil: (promise: Promise<unknown>) => void
}

interface MessageEvent {
  data: Record<string, unknown>
  ports?: Array<{ postMessage: ReturnType<typeof vi.fn> }>
  waitUntil: (promise: Promise<unknown>) => void
}

type ServiceWorkerEvent = NotificationClickEvent | PushEvent | MessageEvent

interface LoadServiceWorkerOptions {
  clients?: {
    matchAll: ReturnType<typeof vi.fn>
    openWindow?: ReturnType<typeof vi.fn>
  }
  hour?: number
  preferences?: {
    soundEnabled?: boolean
    quietHoursStart?: number
    quietHoursEnd?: number
  }
}

function createFixedDate(hour: number) {
  const fixedTime = new Date(2026, 6, 16, hour, 0, 0).getTime()

  return class FixedDate extends Date {
    constructor(...args: unknown[]) {
      super(args.length === 0 ? fixedTime : (args[0] as number))
    }

    static now() {
      return fixedTime
    }
  }
}

function loadServiceWorker({
  clients = { matchAll: vi.fn().mockResolvedValue([]), openWindow: vi.fn() },
  hour = 12,
  preferences,
}: LoadServiceWorkerOptions = {}) {
  const handlers = new Map<string, (event: ServiceWorkerEvent) => void>()
  const source = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8')
  const showNotification = vi.fn().mockResolvedValue(undefined)
  let preferencesResponse =
    preferences === undefined
      ? undefined
      : new Response(JSON.stringify(preferences), {
          headers: { 'content-type': 'application/json' },
        })
  const preferencesCache = {
    match: vi.fn(async () => preferencesResponse?.clone()),
    put: vi.fn(async (_url: string, response: Response) => {
      preferencesResponse = response.clone()
    }),
  }
  const cacheStorage = {
    keys: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
    open: vi.fn().mockResolvedValue(preferencesCache),
  }
  const serviceWorker = {
    location: { origin: 'https://dogeow.com' },
    caches: cacheStorage,
    clients,
    registration: { showNotification },
    skipWaiting: vi.fn(),
    addEventListener: vi.fn((type: string, handler: (event: ServiceWorkerEvent) => void) =>
      handlers.set(type, handler)
    ),
  }

  runInNewContext(source, {
    URL,
    Date: createFixedDate(hour),
    Response,
    caches: cacheStorage,
    self: serviceWorker,
  })

  return { handlers, preferencesCache, showNotification }
}

function loadNotificationClickHandler(clients: NonNullable<LoadServiceWorkerOptions['clients']>) {
  const { handlers } = loadServiceWorker({ clients })

  const handler = handlers.get('notificationclick')
  if (!handler) {
    throw new Error('notificationclick handler was not registered')
  }

  return handler as (event: NotificationClickEvent) => void
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

async function dispatchPush(handler: (event: PushEvent) => void): Promise<void> {
  let pending: Promise<unknown> | undefined
  handler({
    data: {
      json: () => ({
        title: '测试通知',
        body: '测试正文',
        data: { url: '/dashboard', notification_id: 'notification-1' },
      }),
      text: () => '',
    },
    waitUntil: promise => {
      pending = promise
    },
  })

  await pending
}

async function dispatchPreferencesMessage(
  handler: (event: MessageEvent) => void,
  preferences: {
    soundEnabled: boolean
    quietHoursStart: number
    quietHoursEnd: number
  }
): Promise<void> {
  let pending: Promise<unknown> | undefined
  const responsePort = { postMessage: vi.fn() }
  handler({
    data: {
      type: 'SET_NOTIFICATION_PREFERENCES',
      preferences,
    },
    ports: [responsePort],
    waitUntil: promise => {
      pending = promise
    },
  })

  await pending
  expect(responsePort.postMessage).toHaveBeenCalledWith({ ok: true })
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

describe('push service worker notification sound', () => {
  it.each([
    [22, false],
    [23, true],
    [0, true],
    [7, true],
    [8, false],
  ])(
    'uses a 23:00–08:00 quiet period at local hour %s (silent=%s)',
    async (hour, expectedSilent) => {
      const { handlers, showNotification } = loadServiceWorker({
        hour,
        preferences: { soundEnabled: true, quietHoursStart: 23, quietHoursEnd: 8 },
      })
      const handler = handlers.get('push') as ((event: PushEvent) => void) | undefined

      expect(handler).toBeDefined()
      await dispatchPush(handler!)

      const options = showNotification.mock.calls[0]?.[1] as NotificationOptions
      expect(options.silent === true).toBe(expectedSilent)
    }
  )

  it('supports a same-day quiet period', async () => {
    const { handlers, showNotification } = loadServiceWorker({
      hour: 12,
      preferences: { soundEnabled: true, quietHoursStart: 9, quietHoursEnd: 17 },
    })
    const handler = handlers.get('push') as ((event: PushEvent) => void) | undefined

    await dispatchPush(handler!)

    expect(showNotification).toHaveBeenCalledWith(
      '测试通知',
      expect.objectContaining({ silent: true })
    )
  })

  it('fills default quiet hours when reading an old sound-only cache entry', async () => {
    const { handlers, showNotification } = loadServiceWorker({
      hour: 1,
      preferences: { soundEnabled: true },
    })
    const handler = handlers.get('push') as ((event: PushEvent) => void) | undefined

    await dispatchPush(handler!)

    expect(showNotification).toHaveBeenCalledWith(
      '测试通知',
      expect.objectContaining({ silent: true })
    )
  })

  it('disables automatic quiet hours when start and end match', async () => {
    const { handlers, showNotification } = loadServiceWorker({
      hour: 12,
      preferences: { soundEnabled: true, quietHoursStart: 8, quietHoursEnd: 8 },
    })
    const handler = handlers.get('push') as ((event: PushEvent) => void) | undefined

    await dispatchPush(handler!)

    const options = showNotification.mock.calls[0]?.[1] as NotificationOptions
    expect(options.silent).toBeUndefined()
  })

  it('silences notifications all day when sound is disabled', async () => {
    const { handlers, showNotification } = loadServiceWorker({
      hour: 12,
      preferences: { soundEnabled: false, quietHoursStart: 23, quietHoursEnd: 8 },
    })
    const handler = handlers.get('push') as ((event: PushEvent) => void) | undefined

    expect(handler).toBeDefined()
    await dispatchPush(handler!)

    expect(showNotification).toHaveBeenCalledWith(
      '测试通知',
      expect.objectContaining({ silent: true })
    )
  })

  it('persists sound changes received from the page', async () => {
    const { handlers, preferencesCache, showNotification } = loadServiceWorker({ hour: 12 })
    const messageHandler = handlers.get('message') as ((event: MessageEvent) => void) | undefined
    const pushHandler = handlers.get('push') as ((event: PushEvent) => void) | undefined

    expect(messageHandler).toBeDefined()
    expect(pushHandler).toBeDefined()
    await dispatchPreferencesMessage(messageHandler!, {
      soundEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 8,
    })
    await dispatchPush(pushHandler!)

    expect(preferencesCache.put).toHaveBeenCalledOnce()
    expect(showNotification).toHaveBeenCalledWith(
      '测试通知',
      expect.objectContaining({ silent: true })
    )
  })
})
