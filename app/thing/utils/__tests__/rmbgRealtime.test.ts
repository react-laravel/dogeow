import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  ensureRmbgSubscription,
  extractUploadUserId,
  subscribeRmbgStatusUpdates,
  waitForRmbgStatus,
} from '../rmbgRealtime'

const channelListenMock = vi.fn()
const privateChannelMock = {
  listen: channelListenMock,
  stopListening: vi.fn(),
}
const echoLeaveMock = vi.fn()
const echoPrivateMock = vi.fn(() => privateChannelMock)

vi.mock('@/lib/websocket', () => ({
  getEchoInstance: vi.fn(() => ({
    private: echoPrivateMock,
    leave: echoLeaveMock,
  })),
  createEchoInstance: vi.fn(() => ({
    private: echoPrivateMock,
    leave: echoLeaveMock,
  })),
}))

describe('rmbgRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('extractUploadUserId parses user id from upload path', () => {
    expect(extractUploadUserId('uploads/12/abc.jpg')).toBe(12)
    expect(extractUploadUserId('items/1/a.jpg')).toBeNull()
  })

  it('waitForRmbgStatus resolves when websocket event arrives', async () => {
    ensureRmbgSubscription(1)

    const onUpdate = vi.fn()
    const resultPromise = waitForRmbgStatus('uploads/1/abc.jpg', 1, onUpdate)

    const handler = channelListenMock.mock.calls[0]?.[1] as (event: unknown) => void
    handler({
      upload_path: 'uploads/1/abc.jpg',
      status: 'done',
      path: 'uploads/1/abc.png',
      url: 'https://example.com/abc.png',
    })

    await expect(resultPromise).resolves.toBe('done')
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'done', path: 'uploads/1/abc.png' })
    )
    expect(echoPrivateMock).toHaveBeenCalledWith('user.1.uploads')
  })

  it('subscribeRmbgStatusUpdates forwards matching events', () => {
    ensureRmbgSubscription(2)
    const listener = vi.fn()
    const unsubscribe = subscribeRmbgStatusUpdates(2, listener)

    const handler = channelListenMock.mock.calls[0]?.[1] as (event: unknown) => void
    handler({ upload_path: 'uploads/2/a.jpg', status: 'processing' })
    handler({ upload_path: 'uploads/2/a.jpg', status: 'done' })

    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
  })
})
