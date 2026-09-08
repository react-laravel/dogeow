import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../useAiChat'
import { useKnowledgeChat } from '../../../knowledge/hooks/useKnowledgeChat'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  models: [{ value: 'gpt-5.6-luna', label: '5.6 Luna' }],
}))
vi.mock('@/lib/api/internal-auth', () => ({ authenticatedInternalFetch: mocks.fetch }))
vi.mock('../useOllamaModels', () => ({
  useOllamaModels: () => ({ ollamaModels: [], isLoadingOllamaModels: true }),
}))
vi.mock('../useCodexModels', () => ({
  useCodexModels: () => ({ codexModels: mocks.models, isLoadingCodexModels: false }),
}))
vi.mock('../ollamaAccessMode', () => ({
  useOllamaAccessMode: () => ({ effectiveOllamaAccessMode: 'server' }),
}))

function stream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value
    },
  })
  return {
    response: new Response(body),
    chunk: (value: string) =>
      controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(value)}\n`)),
    close: () => controller.close(),
  }
}

describe.each([
  ['general', useAiChat],
  ['knowledge', useKnowledgeChat],
] as const)('%s request lifecycle', (_name, useChat) => {
  beforeEach(() => {
    mocks.fetch.mockReset()
    localStorage.setItem('ai_provider', 'codex')
    localStorage.setItem('knowledge_provider', 'codex')
    localStorage.setItem('codex_model', 'gpt-5.6-luna')
    localStorage.setItem('codex_reasoning_effort', 'medium')
  })
  it('retains a stopped answer and isolates a later request from late chunks', async () => {
    const first = stream()
    const second = stream()
    mocks.fetch.mockResolvedValueOnce(first.response).mockResolvedValueOnce(second.response)
    const { result } = renderHook(() => useChat({ open: true }))
    act(() => result.current.setPrompt('first question'))
    act(() => {
      void result.current.handleSend()
    })
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    act(() => first.chunk('保留这段回答'))
    await waitFor(() => expect(result.current.completion).toBe('保留这段回答'))
    act(() => result.current.stop())
    expect(result.current.messages.at(-1)?.content).toBe('保留这段回答')
    expect(result.current.isLoading).toBe(false)
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true)

    act(() => result.current.setPrompt('second question'))
    act(() => {
      void result.current.handleSend()
    })
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(2))
    await act(async () => {
      first.chunk('旧请求迟到的内容')
      first.close()
    })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.messages.some(message => message.content.includes('迟到'))).toBe(false)
    act(() => {
      second.chunk('这是新的回答')
      second.close()
    })
    await waitFor(() => expect(result.current.messages.at(-1)?.content).toBe('这是新的回答'))
    expect(result.current.isLoading).toBe(false)
  })
  it('aborts an in-flight request when unmounted', async () => {
    const pending = stream()
    mocks.fetch.mockResolvedValue(pending.response)
    const { result, unmount } = renderHook(() => useChat({ open: true }))
    act(() => result.current.setPrompt('question'))
    act(() => {
      void result.current.handleSend()
    })
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    unmount()
    expect(mocks.fetch.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => {
      pending.chunk('late')
      pending.close()
    })
  })
  it('clears the conversation while generating without resurrecting the reply', async () => {
    const pending = stream()
    mocks.fetch.mockResolvedValue(pending.response)
    const { result } = renderHook(() => useChat({ open: true }))
    act(() => result.current.setPrompt('question'))
    act(() => {
      void result.current.handleSend()
    })
    await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(1))
    act(() => pending.chunk('partial'))
    await waitFor(() => expect(result.current.completion).toBe('partial'))
    act(() => result.current.handleClear())
    await act(async () => {
      pending.chunk('late')
      pending.close()
    })
    expect(result.current.messages).toEqual([])
    expect(result.current.completion).toBeUndefined()
  })
})
