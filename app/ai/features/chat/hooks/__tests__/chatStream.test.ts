import { describe, expect, it, vi } from 'vitest'
import { readAiChatStream, readOllamaChatStream } from '../chatStream'

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

describe('readAiChatStream', () => {
  it('accumulates content and stops on done marker', async () => {
    const progress: string[] = []

    const response = createStreamingResponse([
      '0:"你好"\n',
      '0:"，世界"\n',
      'd:{"finishReason":"stop"}\n',
    ])

    const result = await readAiChatStream(response, content => {
      progress.push(content)
    })

    expect(result).toBe('你好，世界')
    expect(progress).toEqual(['你好', '你好，世界'])
  })

  it('handles remaining buffer without newline', async () => {
    const progress: string[] = []
    const response = createStreamingResponse(['0:"final chunk"'])

    const result = await readAiChatStream(response, content => {
      progress.push(content)
    })

    expect(result).toBe('final chunk')
    expect(progress).toEqual(['final chunk'])
  })

  it('warns and continues when chunk parsing fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = createStreamingResponse(['0:not-json\n', '0:"ok"\n'])

    const result = await readAiChatStream(response, () => {})

    expect(result).toBe('ok')
    expect(warnSpy).toHaveBeenCalledWith('Failed to parse content chunk:', '0:not-json')

    warnSpy.mockRestore()
  })
})

describe('readOllamaChatStream', () => {
  it('accumulates content from Ollama chat chunks and stops on done', async () => {
    const progress: string[] = []

    const response = createStreamingResponse([
      '{"message":{"content":"你好"},"done":false}\n',
      '{"message":{"content":"，世界"},"done":false}\n',
      '{"done":true}\n',
    ])

    const result = await readOllamaChatStream(response, content => {
      progress.push(content)
    })

    expect(result).toBe('你好，世界')
    expect(progress).toEqual(['你好', '你好，世界'])
  })

  it('warns and continues when Ollama chunk parsing fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const response = createStreamingResponse([
      'not-json\n',
      '{"response":"ok","done":false}\n',
      '{"done":true}\n',
    ])

    const result = await readOllamaChatStream(response, () => {})

    expect(result).toBe('ok')
    expect(warnSpy).toHaveBeenCalledWith('Failed to parse Ollama chunk:', 'not-json')

    warnSpy.mockRestore()
  })
})
