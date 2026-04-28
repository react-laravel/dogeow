import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useChatWebSocket } from '../useChatWebSocket'

const mocks = vi.hoisted(() => {
  const createMockChannel = () => ({
    listen: vi.fn(),
    stopListening: vi.fn(),
    bind: vi.fn(),
    whisper: vi.fn(),
    listenForWhisper: vi.fn(),
    stopListeningForWhisper: vi.fn(),
  })

  let connectionListener: ((info: Record<string, unknown>) => void) | null = null

  const roomListChannel = createMockChannel()
  const roomChannel = createMockChannel()
  const roomEventChannel = createMockChannel()
  const typingChannel = createMockChannel()

  const echo = {
    channel: vi.fn((channelName: string) => {
      if (channelName === 'chat-rooms-list') {
        return roomListChannel
      }
      if (channelName.startsWith('chat.room.')) {
        return roomChannel
      }
      if (channelName.startsWith('chat-room-')) {
        return roomEventChannel
      }
      return createMockChannel()
    }),
    private: vi.fn(() => typingChannel),
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

  const createConnectionInfo = (status: string) => ({
    status,
    lastConnected: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    lastError: null,
    isRetrying: false,
  })

  const offlineManager = {
    subscribe: vi.fn(() => () => {}),
    queueMessage: vi.fn(),
    retryFailedMessages: vi.fn(),
    clearQueue: vi.fn(),
    destroy: vi.fn(),
    processQueuedMessages: vi.fn(),
  }

  const connectionMonitor = {
    getStatus: vi.fn(() => createConnectionInfo('disconnected')),
    subscribe: vi.fn((listener: (info: Record<string, unknown>) => void) => {
      connectionListener = listener
      return () => {
        connectionListener = null
      }
    }),
    initializeWithEcho: vi.fn(),
    forceReconnect: vi.fn(),
  }

  return {
    createMockChannel,
    roomListChannel,
    roomChannel,
    roomEventChannel,
    typingChannel,
    echo,
    offlineManager,
    connectionMonitor,
    createEchoInstance: vi.fn(() => echo),
    destroyEchoInstance: vi.fn(),
    cancelDestroyEchoInstance: vi.fn(),
    authManager: {
      setRefreshCallback: vi.fn(),
      getToken: vi.fn(() => 'mock-token'),
    },
    emitConnectionStatus(status: string) {
      connectionListener?.(createConnectionInfo(status))
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

describe('useChatWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.echo.channel.mockImplementation((channelName: string) => {
      if (channelName === 'chat-rooms-list') {
        return mocks.roomListChannel
      }
      if (channelName.startsWith('chat.room.')) {
        return mocks.roomChannel
      }
      if (channelName.startsWith('chat-room-')) {
        return mocks.roomEventChannel
      }
      return mocks.createMockChannel()
    })
    mocks.echo.private.mockImplementation(() => mocks.typingChannel)
    mocks.createEchoInstance.mockReturnValue(mocks.echo)
    mocks.connectionMonitor.getStatus.mockReturnValue({
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      lastError: null,
      isRetrying: false,
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('initializes with disconnected defaults', () => {
    const { result } = renderHook(() => useChatWebSocket())

    expect(result.current.echo).toBeNull()
    expect(result.current.isConnected).toBe(false)
    expect(result.current.connectionStatus).toBe('disconnected')
    expect(result.current.offlineState.isOffline).toBe(false)
  })

  it('connects successfully and stores the echo instance', async () => {
    const { result } = renderHook(() => useChatWebSocket())

    await act(async () => {
      const success = await result.current.connect()
      expect(success).toBe(true)
    })

    expect(mocks.connectionMonitor.initializeWithEcho).toHaveBeenCalledWith(mocks.echo)
    expect(result.current.echo).toBe(mocks.echo)
    expect(mocks.echo.channel).toHaveBeenCalledWith('chat-rooms-list')
  })

  it('reports connection errors through onError', async () => {
    mocks.createEchoInstance.mockImplementationOnce(() => {
      throw new Error('Connection failed')
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useChatWebSocket({ onError }))

    await act(async () => {
      const success = await result.current.connect()
      expect(success).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'connection', message: 'Connection failed' })
    )
  })

  it('disconnects and clears the echo instance', async () => {
    const { result } = renderHook(() => useChatWebSocket())

    await act(async () => {
      await result.current.connect()
      await result.current.disconnect()
    })

    expect(mocks.destroyEchoInstance).toHaveBeenCalled()
    expect(result.current.echo).toBeNull()
  })

  it('joins a room and subscribes room, room-count, and typing channels', async () => {
    const { result } = renderHook(() => useChatWebSocket())

    await act(async () => {
      await result.current.joinRoom('room-1', mocks.echo as never)
    })

    expect(mocks.echo.channel).toHaveBeenCalledWith('chat-rooms-list')
    expect(mocks.echo.channel).toHaveBeenCalledWith('chat.room.room-1')
    expect(mocks.echo.channel).toHaveBeenCalledWith('chat-room-room-1')
    expect(mocks.echo.private).toHaveBeenCalledWith('chat.room.room-1.typing')
  })

  it('cleans up room and room-list subscriptions on unmount', async () => {
    const { result, unmount } = renderHook(() => useChatWebSocket())

    await act(async () => {
      await result.current.joinRoom('room-1', mocks.echo as never)
    })

    unmount()

    expect(mocks.roomChannel.stopListening).toHaveBeenCalled()
    expect(mocks.typingChannel.stopListeningForWhisper).toHaveBeenCalledWith('typing')
    expect(mocks.echo.leave).toHaveBeenCalledWith('chat-rooms-list')
    expect(mocks.echo.leave).toHaveBeenCalledWith('chat.room.room-1.typing')
    expect(mocks.destroyEchoInstance).toHaveBeenCalledWith(false)
  })

  it('queues messages while disconnected', async () => {
    const { result } = renderHook(() => useChatWebSocket())

    await act(async () => {
      const response = await result.current.sendMessage('room-1', 'Hello World')
      expect(response).toEqual({ success: true })
    })

    expect(mocks.offlineManager.queueMessage).toHaveBeenCalledWith('room-1', 'Hello World')
  })

  it('retries and clears offline queue through the offline manager', () => {
    const { result } = renderHook(() => useChatWebSocket())

    act(() => {
      result.current.retryFailedMessages()
      result.current.clearOfflineQueue()
    })

    expect(mocks.offlineManager.retryFailedMessages).toHaveBeenCalled()
    expect(mocks.offlineManager.clearQueue).toHaveBeenCalled()
  })

  it('delegates reconnect to the connection monitor', () => {
    const { result } = renderHook(() => useChatWebSocket())

    act(() => {
      result.current.reconnect()
    })

    expect(mocks.connectionMonitor.forceReconnect).toHaveBeenCalled()
  })

  it('calls onConnect when the connection monitor emits connected', async () => {
    const onConnect = vi.fn()
    renderHook(() => useChatWebSocket({ onConnect }))

    act(() => {
      mocks.emitConnectionStatus('connected')
    })

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalled()
    })
  })
})
