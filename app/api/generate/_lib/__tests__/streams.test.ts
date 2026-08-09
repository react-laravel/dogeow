import { describe, expect, it } from 'vitest'
import { createCodexResponsesStreamResponse, escapeJsonString } from '../streams'

async function readStreamText(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('missing body')
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
  }
  return text
}

describe('createCodexResponsesStreamResponse', () => {
  it('converts response.output_text.delta SSE into AI data stream chunks', async () => {
    const sse = [
      'event: response.output_text.delta',
      'data: {"type":"response.output_text.delta","delta":"你"}',
      '',
      'event: response.output_text.delta',
      'data: {"type":"response.output_text.delta","delta":"好"}',
      '',
      'event: response.completed',
      'data: {"type":"response.completed","response":{"usage":{"input_tokens":12,"output_tokens":2,"total_tokens":14}}}',
      '',
    ].join('\n')

    const upstream = new Response(sse, {
      headers: { 'Content-Type': 'text/event-stream' },
    })

    const response = createCodexResponsesStreamResponse(upstream, 10)
    const text = await readStreamText(response)

    expect(text).toContain('0:"你"\n')
    expect(text).toContain('0:"好"\n')
    expect(text).toContain(
      `d:${JSON.stringify({
        finishReason: 'stop',
        usage: {
          promptTokens: 12,
          completionTokens: 2,
          totalTokens: 14,
        },
      })}\n`
    )
  })

  it('emits an error chunk when the stream ends without output', async () => {
    const upstream = new Response('', {
      headers: { 'Content-Type': 'text/event-stream' },
    })

    const response = createCodexResponsesStreamResponse(upstream, 8)
    const text = await readStreamText(response)

    expect(text).toContain('ChatGPT 调用失败')
    expect(text).toContain('"finishReason":"error"')
  })
})

describe('escapeJsonString', () => {
  it('escapes control characters for data-stream text chunks', () => {
    expect(escapeJsonString('a\nb"c\\d')).toBe('a\\nb\\"c\\\\d')
  })
})
