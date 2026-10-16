import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { destroyConnectionMonitor, getConnectionMonitor } from '../connection-monitor'

const { events, echo, destroyEcho } = vi.hoisted(() => {
  const events = new Map<string, (error?: unknown) => void>()
  return {
    events,
    destroyEcho: vi.fn(),
    echo: {
      connector: {
        pusher: {
          connection: {
            bind: vi.fn((name: string, handler: (error?: unknown) => void) => {
              events.set(name, handler)
            }),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        },
      },
    },
  }
})

vi.mock('../echo', () => ({
  getEchoInstance: () => echo,
  destroyEchoInstance: destroyEcho,
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  events.clear()
  const monitor = getConnectionMonitor()
  monitor.initializeWithEcho(echo as unknown as Parameters<typeof monitor.initializeWithEcho>[0])
})

afterEach(() => {
  destroyConnectionMonitor()
  vi.useRealTimers()
})

describe('connection monitor active retry behavior', () => {
  it('does not start retries for a plain disconnect event', () => {
    events.get('disconnected')!()
    vi.advanceTimersByTime(60_000)

    expect(echo.connector.pusher.connect).not.toHaveBeenCalled()
    expect(getConnectionMonitor().getStatus().status).toBe('disconnected')
  })

  it('retries a recoverable connection error through the error handler', () => {
    events.get('error')!({ code: 4100 })
    expect(echo.connector.pusher.connect).not.toHaveBeenCalled()
    expect(getConnectionMonitor().getStatus()).toMatchObject({
      status: 'reconnecting',
      reconnectAttempts: 1,
      isRetrying: true,
    })

    vi.advanceTimersByTime(1000)
    expect(echo.connector.pusher.connect).toHaveBeenCalledOnce()
  })

  it('cancels a pending retry when the connection succeeds', () => {
    events.get('error')!({ code: 4100 })
    events.get('connected')!()
    vi.advanceTimersByTime(60_000)

    expect(echo.connector.pusher.connect).not.toHaveBeenCalled()
    expect(getConnectionMonitor().getStatus()).toMatchObject({
      status: 'connected',
      reconnectAttempts: 0,
      isRetrying: false,
      lastError: null,
    })
  })

  it('destroys the stale Echo instance on authentication failure without retrying', () => {
    events.get('error')!({ code: 4001 })
    vi.advanceTimersByTime(60_000)

    expect(destroyEcho).toHaveBeenCalledOnce()
    expect(echo.connector.pusher.connect).not.toHaveBeenCalled()
  })

  it('cancels pending retries when the monitor is destroyed', () => {
    events.get('error')!({ code: 4100 })
    destroyConnectionMonitor()
    vi.advanceTimersByTime(60_000)

    expect(echo.connector.pusher.connect).not.toHaveBeenCalled()
  })
})
