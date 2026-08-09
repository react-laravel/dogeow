import type { OllamaResponse } from './types'

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'x-vercel-ai-data-stream': 'v1',
}

export const escapeJsonString = (str: string): string =>
  str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')

interface CodexSseEvent {
  type?: string
  delta?: string
  error?: { message?: string } | string
  response?: {
    usage?: {
      input_tokens?: number
      output_tokens?: number
      total_tokens?: number
    }
  }
}

function parseSseChunk(buffer: string): { events: string[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const rest = parts.pop() ?? ''
  return { events: parts.filter(Boolean), rest }
}

function extractSseDataLines(eventBlock: string): string[] {
  return eventBlock
    .split('\n')
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trim())
    .filter(Boolean)
}

export function createCodexResponsesStreamResponse(
  codexResponse: Response,
  promptTokens: number
): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = codexResponse.body?.getReader()
      if (!reader) {
        controller.enqueue(
          encoder.encode(`0:"${escapeJsonString('ChatGPT 调用失败：响应体为空。')}"\n`)
        )
        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'error',
              usage: {
                promptTokens,
                completionTokens: 0,
                totalTokens: promptTokens,
              },
            })}\n`
          )
        )
        controller.close()
        return
      }

      let buffer = ''
      let outputTokens = 0
      let hasOutput = false
      let closed = false
      let usagePromptTokens = promptTokens
      let usageCompletionTokens = 0

      const closeWithDone = (finishReason: 'stop' | 'error' = 'stop') => {
        if (closed) return
        closed = true
        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason,
              usage: {
                promptTokens: usagePromptTokens,
                completionTokens: usageCompletionTokens || outputTokens,
                totalTokens: usagePromptTokens + (usageCompletionTokens || outputTokens),
              },
            })}\n`
          )
        )
        controller.close()
      }

      const enqueueText = (text: string) => {
        if (!text || closed) return
        hasOutput = true
        outputTokens += Math.ceil(text.length / 4)
        controller.enqueue(encoder.encode(`0:"${escapeJsonString(text)}"\n`))
      }

      const processEventBlock = (eventBlock: string): 'continue' | 'stop' | 'error' => {
        for (const data of extractSseDataLines(eventBlock)) {
          if (data === '[DONE]') {
            return hasOutput ? 'stop' : 'error'
          }

          let payload: CodexSseEvent
          try {
            payload = JSON.parse(data) as CodexSseEvent
          } catch {
            continue
          }

          if (payload.type === 'response.output_text.delta' && typeof payload.delta === 'string') {
            enqueueText(payload.delta)
            continue
          }

          if (payload.type === 'response.failed' || payload.type === 'error') {
            const message =
              typeof payload.error === 'string'
                ? payload.error
                : payload.error?.message || 'ChatGPT 响应失败'
            if (!hasOutput) {
              enqueueText(`ChatGPT 调用失败：${message}`)
            }
            return 'error'
          }

          if (payload.type === 'response.completed') {
            const usage = payload.response?.usage
            if (usage) {
              usagePromptTokens = usage.input_tokens ?? usagePromptTokens
              usageCompletionTokens = usage.output_tokens ?? usageCompletionTokens
            }
            return 'stop'
          }
        }

        return 'continue'
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const { events, rest } = parseSseChunk(buffer)
          buffer = rest

          for (const eventBlock of events) {
            const result = processEventBlock(eventBlock)
            if (result !== 'continue') {
              closeWithDone(result)
              return
            }
          }
        }

        // Flush trailing SSE block that may lack a final blank line.
        if (buffer.trim()) {
          const result = processEventBlock(buffer)
          if (result !== 'continue') {
            closeWithDone(result)
            return
          }
        }

        if (!hasOutput) {
          enqueueText(
            'ChatGPT 调用失败：未收到模型输出。请确认已执行 codex login --device-auth 完成设备登录。'
          )
          closeWithDone('error')
          return
        }

        closeWithDone('stop')
      } catch (error) {
        const message = error instanceof Error ? error.message : '未知错误'
        if (!hasOutput) {
          enqueueText(`ChatGPT 调用失败：${message}`)
        }
        closeWithDone('error')
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}

export function createStreamResponse(
  ollamaResponse: Response,
  prompt: string,
  promptTokensOverride?: number
): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaResponse.body?.getReader()
      if (!reader) return controller.error(new Error('无法获取响应流'))

      let buffer = ''
      let totalTokens = 0
      const promptTokens = promptTokensOverride ?? Math.ceil(prompt.length / 4)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data: OllamaResponse = JSON.parse(line)
              const content = data.response ?? data.message?.content ?? ''
              if (content) {
                controller.enqueue(encoder.encode(`0:"${escapeJsonString(content)}"\n`))
                totalTokens += Math.ceil(content.length / 4)
              }
              if (data.done) {
                controller.enqueue(
                  encoder.encode(
                    `d:${JSON.stringify({
                      finishReason: 'stop',
                      usage: {
                        promptTokens,
                        completionTokens: totalTokens,
                        totalTokens: promptTokens + totalTokens,
                      },
                    })}\n`
                  )
                )
                controller.close()
                return
              }
            } catch {}
          }
        }

        if (buffer.trim()) {
          try {
            const data: OllamaResponse = JSON.parse(buffer)
            if (data.done) {
              controller.enqueue(
                encoder.encode(
                  `d:${JSON.stringify({
                    finishReason: 'stop',
                    usage: {
                      promptTokens,
                      completionTokens: totalTokens,
                      totalTokens: promptTokens + totalTokens,
                    },
                  })}\n`
                )
              )
            }
          } catch {}
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      } finally {
        reader.releaseLock()
      }
    },
  })

  return new Response(stream, { headers: STREAM_HEADERS })
}
