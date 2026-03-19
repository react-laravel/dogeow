import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../useAiChat'

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
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: 'qwen3:0.6b', supportsVision: false }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() => useAiChat({ open: true }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/ollama/models')
    })
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
})
