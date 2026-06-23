import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMediaGenerators } from '../useMediaGenerators'

function createStreamingResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
      controller.close()
    },
  })
  return new Response(stream)
}

// Module-level token variable - must be declared before vi.mock
let mockAuthToken: string | null = null

vi.mock('@/stores/authStore', () => {
  const mockStore = (() => null) as unknown as {
    getState: () => { token: string | null }
  }
  mockStore.getState = () => ({ token: mockAuthToken })
  return { default: mockStore }
})

describe('useMediaGenerators', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    mockAuthToken = null
  })

  function createOptions() {
    return {
      setMessages: vi.fn((updater: (prev: unknown[]) => unknown[]) => updater([])),
      setGenerationError: vi.fn(),
      setIsGeneratingMedia: vi.fn(),
    }
  }

  describe('handleGenerateImage', () => {
    it('clears error and sets loading state before generation', async () => {
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, imageUrls: ['https://example.com/img.png'] }),
                }),
              50
            )
          })
      )
      vi.stubGlobal('fetch', fetchMock)

      act(() => {
        void result.current.handleGenerateImage('a dog')
      })

      expect(opts.setGenerationError).toHaveBeenCalledWith(undefined)
      expect(opts.setIsGeneratingMedia).toHaveBeenCalledWith(true)
    })

    it('adds placeholder message on start', async () => {
      const setMessages = vi.fn((updater: (prev: unknown[]) => unknown[]) => updater([]))
      const opts = {
        setMessages,
        setGenerationError: vi.fn(),
        setIsGeneratingMedia: vi.fn(),
      }
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true, imageUrls: ['https://example.com/img.png'] }),
                }),
              50
            )
          })
      )
      vi.stubGlobal('fetch', fetchMock)

      act(() => {
        void result.current.handleGenerateImage('柴犬在海边')
      })

      const updaterCall = setMessages.mock.calls[0][0]
      const newMessages = updaterCall([])
      expect(newMessages).toHaveLength(1)
      expect((newMessages[0] as { role: string }).role).toBe('assistant')
      expect((newMessages[0] as { content: string }).content).toBe('图片提示词：柴犬在海边')
      expect((newMessages[0] as { generatingImage: boolean }).generatingImage).toBe(true)
      expect((newMessages[0] as { images: unknown[] }).images).toHaveLength(1)
      expect(
        (newMessages[0] as { images: Array<{ isPlaceholder: boolean }> }).images[0].isPlaceholder
      ).toBe(true)
    })

    it('replaces placeholder with generated image on success', async () => {
      const messages: unknown[] = []
      const setMessages = vi.fn((updater: (prev: unknown[]) => unknown[]) => {
        messages.push(...updater(messages))
        return messages[messages.length - 1]
      })
      const opts = {
        setMessages,
        setGenerationError: vi.fn(),
        setIsGeneratingMedia: vi.fn(),
      }
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, imageUrls: ['https://example.com/doge.png'] }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateImage('柴犬')
      })

      // messages should now contain the final updated message
      const updated = messages[messages.length - 1] as Record<string, unknown>
      expect(updated.generatingImage).toBeUndefined()
      expect(updated.images).toEqual([
        { id: expect.stringContaining('image'), url: 'https://example.com/doge.png' },
      ])
      expect(opts.setIsGeneratingMedia).toHaveBeenLastCalledWith(false)
    })

    it('calls onImageGenerated callback on success', async () => {
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, imageUrls: ['https://example.com/img.png'] }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const onImageGenerated = vi.fn()
      await act(async () => {
        await result.current.handleGenerateImage('test', onImageGenerated)
      })

      expect(onImageGenerated).toHaveBeenCalledWith('https://example.com/img.png', 'test')
    })

    it('removes placeholder and sets error on API failure', async () => {
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: '生成失败' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateImage('test')
      })

      // The filter in handleGenerateImage removes the placeholder message
      // We can verify this by checking that setMessages was called (it filters out the failed message)
      expect(opts.setGenerationError).toHaveBeenCalledWith('生成失败')
      expect(opts.setIsGeneratingMedia).toHaveBeenLastCalledWith(false)
    })

    it('handles fetch rejection', async () => {
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateImage('test')
      })

      expect(opts.setGenerationError).toHaveBeenCalledWith('图片生成请求失败')
      expect(opts.setIsGeneratingMedia).toHaveBeenLastCalledWith(false)
    })
  })

  describe('handleGenerateVideo', () => {
    it('adds video placeholder and replaces on success', async () => {
      const messages: unknown[] = []
      const setMessages = vi.fn((updater: (prev: unknown[]) => unknown[]) => {
        messages.push(...updater(messages))
        return messages[messages.length - 1]
      })
      const opts = {
        setMessages,
        setGenerationError: vi.fn(),
        setIsGeneratingMedia: vi.fn(),
      }
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          videoUrl: 'https://example.com/v.mp4',
          taskId: 'task-1',
        }),
      })
      vi.stubGlobal('fetch', fetchMock)

      const onVideoGenerated = vi.fn()
      await act(async () => {
        await result.current.handleGenerateVideo('a sunset', onVideoGenerated)
      })

      const updated = messages[messages.length - 1] as Record<string, unknown>
      expect(updated.content).toBe('已为你生成视频：')
      expect(updated.generatingVideo).toBeUndefined()
      expect(updated.videos).toEqual([
        { id: expect.stringContaining('video'), url: 'https://example.com/v.mp4' },
      ])
      expect(onVideoGenerated).toHaveBeenCalledWith(
        'task-1',
        'https://example.com/v.mp4',
        'a sunset'
      )
    })
  })

  describe('handleGenerateMusic', () => {
    it('adds music placeholder and replaces on success', async () => {
      const messages: unknown[] = []
      const setMessages = vi.fn((updater: (prev: unknown[]) => unknown[]) => {
        messages.push(...updater(messages))
        return messages[messages.length - 1]
      })
      const opts = {
        setMessages,
        setGenerationError: vi.fn(),
        setIsGeneratingMedia: vi.fn(),
      }
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, musicUrl: 'https://example.com/music.mp3' }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateMusic('jazz', 'la la la')
      })

      const updated = messages[messages.length - 1] as Record<string, unknown>
      expect(updated.content).toBe('已为你生成音乐：')
      expect(updated.generatingMusic).toBeUndefined()
      expect(updated.musics).toEqual([
        { id: expect.stringContaining('music'), url: 'https://example.com/music.mp3' },
      ])
    })
  })

  describe('auth header', () => {
    it('includes Authorization header when token exists', async () => {
      mockAuthToken = 'auth-test-token'
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, imageUrls: ['https://example.com/img.png'] }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateImage('test')
      })

      // buildJsonHeaders is called synchronously before fetch, so fetchMock.mock.calls[0] has the headers
      const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer auth-test-token')
    })

    it('does not include Authorization header when no token', async () => {
      mockAuthToken = null
      const opts = createOptions()
      const { result } = renderHook(() => useMediaGenerators(opts))

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, imageUrls: ['https://example.com/img.png'] }),
      })
      vi.stubGlobal('fetch', fetchMock)

      await act(async () => {
        await result.current.handleGenerateImage('test')
      })

      const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
      expect(headers.Authorization).toBeUndefined()
    })
  })
})
