import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useKnowledgeChat } from '../useKnowledgeChat'

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

describe('useKnowledgeChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.removeItem('ollama_access_mode_override')
    localStorage.removeItem('browser_ollama_address')
    localStorage.removeItem('ollama_model')
    localStorage.removeItem('knowledge_provider')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses browser-local Ollama after preparing knowledge context on the server', async () => {
    localStorage.setItem('ollama_access_mode_override', 'browser')

    const fetchMock = vi
      .fn()
      .mockImplementation((input: string | URL | Request, init?: RequestInit) => {
        if (input === 'http://localhost:11434/api/tags') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ models: [{ name: 'gemma3:4b' }] }),
          })
        }

        if (input === '/api/knowledge/chat') {
          const body = JSON.parse(String(init?.body)) as {
            prepareOnly?: boolean
            messages: Array<{ role: string; content: string }>
          }

          expect(body.prepareOnly).toBe(true)
          expect(body.messages).toEqual([{ role: 'user', content: '你好' }])

          return Promise.resolve({
            ok: true,
            json: async () => ({
              messages: [
                { role: 'system', content: '知识库上下文' },
                { role: 'user', content: '你好' },
              ],
            }),
          })
        }

        if (input === 'http://localhost:11434/api/chat') {
          return Promise.resolve(
            createStreamingResponse([
              '{"message":{"content":"你好"},"done":false}\n',
              '{"message":{"content":"，来自知识库 Ollama"},"done":false}\n',
              '{"done":true}\n',
            ])
          )
        }

        return Promise.reject(new Error(`Unexpected fetch: ${String(input)}`))
      })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useKnowledgeChat({ open: true }))

    await waitFor(() => {
      expect(result.current.ollamaModels).toEqual([{ name: 'gemma3:4b', supportsVision: false }])
      expect(result.current.model).toBe('gemma3:4b')
    })

    act(() => {
      result.current.setPrompt('你好')
    })

    await act(async () => {
      await result.current.handleSend()
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/knowledge/chat',
      expect.objectContaining({
        method: 'POST',
      })
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/chat',
      expect.objectContaining({
        method: 'POST',
      })
    )

    await waitFor(() => {
      expect(result.current.messages).toEqual([
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好，来自知识库 Ollama' },
      ])
    })
  })
})
