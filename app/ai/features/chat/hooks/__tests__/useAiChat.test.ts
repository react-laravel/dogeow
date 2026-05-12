import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../useAiChat'

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

vi.mock('@/stores/authStore', () => {
  const mockStore = (() => null) as unknown as {
    getState: () => { token: string | null }
  }

  mockStore.getState = () => ({ token: null })

  return {
    default: mockStore,
  }
})

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useAiChat model loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ollama_access_mode_override')
    localStorage.removeItem('browser_ollama_address')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('zhipuai_model')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not request Ollama models when dialog is closed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: false }))

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('requests Ollama models when dialog is open and provider is ollama', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://localhost:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'qwen3:0.6b' }] }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags')
    })
  })

  it('requests Ollama models using the configured browser address', async () => {
    localStorage.setItem('browser_ollama_address', '100.88.77.66:11434')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://100.88.77.66:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'qwen3:0.6b' }] }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://100.88.77.66:11434/api/tags')
    })
  })

  it('falls back to the server model endpoint when browser-local Ollama is unavailable', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://localhost:11434/api/tags') {
        return Promise.reject(new Error('Network error'))
      }

      if (input === '/api/ollama/models') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'gemma4:e4b', supportsVision: false }] }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([{ name: 'gemma4:e4b', supportsVision: false }])
    })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags')
    expect(fetchMock).toHaveBeenCalledWith('/api/ollama/models')
  })

  it('requests Ollama models through the server when access mode is server', async () => {
    localStorage.setItem('ollama_access_mode_override', 'server')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === '/api/ollama/models') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'gemma4:e4b', supportsVision: false }] }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([{ name: 'gemma4:e4b', supportsVision: false }])
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/ollama/models')
    expect(fetchMock).not.toHaveBeenCalledWith('http://localhost:11434/api/tags')
  })

  it('does not request Ollama models when provider is not ollama', async () => {
    localStorage.setItem('ai_provider', 'github')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalled()
    })
  })

  it('shows an image placeholder message and replaces it with the generated image', async () => {
    localStorage.setItem('ai_provider', 'github')

    let resolveFetch: ((value: unknown) => void) | undefined
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const onImageGenerated = vi.fn()
    const { result } = renderHook(() => useAiChat({ open: false }))

    act(() => {
      void result.current.handleGenerateImage('柴犬在海边奔跑', onImageGenerated)
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0]).toMatchObject({
        role: 'assistant',
        content: '图片提示词：柴犬在海边奔跑',
        generatingImage: true,
      })
      expect(result.current.messages[0].images).toEqual([
        { id: expect.any(String), isPlaceholder: true },
      ])
    })

    const placeholderImageId = result.current.messages[0].images?.[0]?.id

    act(() => {
      resolveFetch?.({
        ok: true,
        json: async () => ({
          success: true,
          imageUrls: ['https://example.com/generated-doge.png'],
        }),
      })
    })

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(1)
      expect(result.current.messages[0].content).toBe('图片提示词：柴犬在海边奔跑')
      expect(result.current.messages[0].generatingImage).toBeUndefined()
      expect(result.current.messages[0].images).toEqual([
        { id: placeholderImageId, url: 'https://example.com/generated-doge.png' },
      ])
    })

    expect(onImageGenerated).toHaveBeenCalledWith(
      'https://example.com/generated-doge.png',
      '柴犬在海边奔跑'
    )
  })

  it('sends Ollama chat requests directly to browser-local Ollama when available', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://localhost:11434/api/chat') {
        return Promise.resolve(
          createStreamingResponse([
            '{"message":{"content":"你好"},"done":false}\n',
            '{"message":{"content":"，本地 Ollama"},"done":false}\n',
            '{"done":true}\n',
          ])
        )
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: false }))

    act(() => {
      result.current.setPrompt('你好')
    })

    await act(async () => {
      await result.current.handleSend()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
      })
    )

    await waitFor(() => {
      expect(result.current.messages).toEqual([
        { role: 'user', content: '你好', images: [] },
        { role: 'assistant', content: '你好，本地 Ollama' },
      ])
    })
  })

  it('sends Ollama chat requests through the server when access mode is server', async () => {
    localStorage.setItem('ollama_access_mode_override', 'server')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === '/api/generate') {
        return Promise.resolve(
          createStreamingResponse([
            '0:"你好"\n',
            '0:"，服务器 Ollama"\n',
            'd:{"finishReason":"stop"}\n',
          ])
        )
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: false }))

    act(() => {
      result.current.setPrompt('你好')
    })

    await act(async () => {
      await result.current.handleSend()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({
        method: 'POST',
      })
    )

    await waitFor(() => {
      expect(result.current.messages).toEqual([
        { role: 'user', content: '你好', images: [] },
        { role: 'assistant', content: '你好，服务器 Ollama' },
      ])
    })
  })
})
