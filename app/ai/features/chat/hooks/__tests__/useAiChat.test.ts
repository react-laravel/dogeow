import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../useAiChat'
import { setStoredBrowserOllamaAddress } from '../browserOllama'

let mockAuthToken: string | null = null

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

  mockStore.getState = () => ({ token: mockAuthToken })

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
    mockAuthToken = null
    localStorage.removeItem('ai_provider')
    localStorage.removeItem('ollama_access_mode_override')
    localStorage.removeItem('browser_ollama_address')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('zhipuai_model')
    localStorage.removeItem('codex_model')
    localStorage.removeItem('codex_reasoning_effort')
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
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
        cache: 'no-store',
      })
    })
  })

  it('selects the first actual Ollama model when the stored model is unavailable', async () => {
    localStorage.setItem('ollama_model', 'qwen2.5:0.5b')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://localhost:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'gemma3:4b' }, { name: 'llama3.2:3b' }] }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([
        { name: 'gemma3:4b', supportsVision: false },
        { name: 'llama3.2:3b', supportsVision: false },
      ])
      expect(result.current.model).toBe('gemma3:4b')
    })

    expect(localStorage.getItem('ollama_model')).toBe('gemma3:4b')
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
      expect(fetchMock).toHaveBeenCalledWith('http://100.88.77.66:11434/api/tags', {
        cache: 'no-store',
      })
    })
  })

  it('refetches Ollama models after the browser address changes', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === 'http://localhost:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'qwen3:0.6b' }] }),
        })
      }

      if (input === 'http://100.104.64.84:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            models: [
              { name: 'gemma3:4b' },
              { name: 'qwen3-embedding:0.6b' },
              { name: 'deepseek-r1:cloud' },
            ],
          }),
        })
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([{ name: 'qwen3:0.6b', supportsVision: false }])
    })

    act(() => {
      setStoredBrowserOllamaAddress('100.104.64.84:11434')
    })

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([{ name: 'gemma3:4b', supportsVision: false }])
    })

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
      cache: 'no-store',
    })
    expect(fetchMock).toHaveBeenCalledWith('http://100.104.64.84:11434/api/tags', {
      cache: 'no-store',
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

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', {
      cache: 'no-store',
    })
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

  it('sends Codex model and reasoning effort through the server', async () => {
    localStorage.setItem('ai_provider', 'codex')
    localStorage.setItem('codex_model', 'gpt-5.4')
    localStorage.setItem('codex_reasoning_effort', 'high')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === '/api/generate') {
        return Promise.resolve(
          createStreamingResponse(['0:"你好，Codex"\n', 'd:{"finishReason":"stop"}\n'])
        )
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    expect(result.current.provider).toBe('codex')
    expect(result.current.model).toBe('gpt-5.4')
    expect(result.current.codexReasoningEffort).toBe('high')

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
        body: expect.stringContaining('"model":"gpt-5.4"'),
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/generate',
      expect.objectContaining({
        body: expect.stringContaining('"codexReasoningEffort":"high"'),
      })
    )
  })

  it('sends the SPA auth token to protected server AI routes', async () => {
    mockAuthToken = 'auth-test-token'
    localStorage.setItem('ai_provider', 'codex')

    const fetchMock = vi.fn().mockImplementation((input: string | URL | Request) => {
      if (input === '/api/generate') {
        return Promise.resolve(
          createStreamingResponse(['0:"你好"\n', 'd:{"finishReason":"stop"}\n'])
        )
      }

      return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useAiChat({ open: true }))

    act(() => {
      result.current.setPrompt('你好')
    })

    await act(async () => {
      await result.current.handleSend()
    })

    const generateCall = fetchMock.mock.calls.find(([input]) => input === '/api/generate')
    expect(generateCall).toBeTruthy()
    const headers = new Headers((generateCall?.[1] as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer auth-test-token')
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
      if (input === 'http://localhost:11434/api/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'gemma3:4b' }] }),
        })
      }

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

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.model).toBe('gemma3:4b')
    })

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
      if (input === '/api/ollama/models') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ models: [{ name: 'gemma3:4b', supportsVision: false }] }),
        })
      }

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

    const { result } = renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(result.current.model).toBe('gemma3:4b')
    })

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
