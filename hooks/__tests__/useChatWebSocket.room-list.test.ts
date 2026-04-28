import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useChatWebSocket } from '../useChatWebSocket'

const mocks = vi.hoisted(() => {
  const createMockChannel = () => ({
    listen: vi.fn(),
    stopListening: vi.fn(),
    bind: vi.fn(),
  })

  const roomListChannel = createMockChannel()
  const echo = {
    channel: vi.fn((channelName: string) =>
      channelName === 'chat-rooms-list' ? roomListChannel : createMockChannel()
    ),
    private: vi.fn(() => createMockChannel()),
    leave: vi.fn(),
    connector: {
      pusher: {
        connection: {
          state: 'disconnected',
          bind: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      },
    },
  }

  return {
    createMockChannel,
    roomListChannel,
    echo,
    createEchoInstance: vi.fn(() => echo),
    destroyEchoInstance: vi.fn(),
    cancelDestroyEchoInstance: vi.fn(),
    connectionMonitor: {
      getStatus: vi.fn(() => ({
        status: 'disconnected',
        lastConnected: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        lastError: null,
        isRetrying: false,
      })),
      subscribe: vi.fn(() => () => {}),
      initializeWithEcho: vi.fn(),
      forceReconnect: vi.fn(),
    },
    authManager: {
      setRefreshCallback: vi.fn(),
      getToken: vi.fn(() => 'mock-token'),
    },
    offlineManager: {
      subscribe: vi.fn(() => () => {}),
      destroy: vi.fn(),
      processQueuedMessages: vi.fn(),
      retryFailedMessages: vi.fn(),
      clearQueue: vi.fn(),
      queueMessage: vi.fn(),
    },
  }
})

vi.mock('@/lib/websocket', () => ({
  createEchoInstance: mocks.createEchoInstance,
  destroyEchoInstance: mocks.destroyEchoInstance,
  cancelDestroyEchoInstance: mocks.cancelDestroyEchoInstance,
  getConnectionMonitor: vi.fn(() => mocks.connectionMonitor),
  getAuthManager: vi.fn(() => mocks.authManager),
}))

vi.mock('@/lib/websocket/offline-manager', () => ({
  default: vi.fn().mockImplementation(function MockOfflineManager() {
    return mocks.offlineManager
  }),
}))

describe('useChatWebSocket room list subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mocks.echo.channel.mockImplementation((channelName: string) =>
      channelName === 'chat-rooms-list' ? mocks.roomListChannel : mocks.createMockChannel()
    )
    mocks.createEchoInstance.mockReturnValue(mocks.echo)
  })

  it('subscribes to the global room list channel on connect and forwards room count events', async () => {
    const onMessage = vi.fn()
    const { result } = renderHook(() => useChatWebSocket({ onMessage }))

    await act(async () => {
      const connected = await result.current.connect()
      expect(connected).toBe(true)
    })

    expect(mocks.echo.channel).toHaveBeenCalledWith('chat-rooms-list')
    expect(mocks.roomListChannel.listen).toHaveBeenCalledWith(
      '.user.joined.room',
      expect.any(Function)
    )
    expect(mocks.roomListChannel.listen).toHaveBeenCalledWith(
      '.user.left.room',
      expect.any(Function)
    )

    const joinedListener = mocks.roomListChannel.listen.mock.calls.find(
      ([eventName]) => eventName === '.user.joined.room'
    )?.[1]

    joinedListener?.({ room_id: 9, online_count: 4 })

    expect(onMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'user.joined.room', room_id: 9, online_count: 4 })
    )
  })

  it('subscribes to the global room list channel during autoConnect', async () => {
    renderHook(() => useChatWebSocket({ autoConnect: true }))

    await waitFor(() => {
      expect(mocks.echo.channel).toHaveBeenCalledWith('chat-rooms-list')
    })
  })
})
