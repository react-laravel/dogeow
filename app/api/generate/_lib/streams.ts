import type { ChildProcessByStdio } from 'node:child_process'
import type { Readable } from 'node:stream'
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

export function createCodexExecStreamResponse(
  codexProcess: ChildProcessByStdio<null, Readable, Readable>,
  promptTokens: number
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let outputTokens = 0
      let hasOutput = false
      let stderr = ''
      let closed = false

      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(`0:""\n`))
        }
      }, 10000)

      const closeWithDone = () => {
        if (closed) return
        closed = true
        clearInterval(heartbeat)
        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: 'stop',
              usage: {
                promptTokens,
                completionTokens: outputTokens,
                totalTokens: promptTokens + outputTokens,
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

      codexProcess.stdout.on('data', chunk => {
        enqueueText(String(chunk))
      })

      codexProcess.stderr.on('data', chunk => {
        stderr += String(chunk)
      })

      codexProcess.on('error', error => {
        enqueueText(
          `Codex CLI 无法启动：${error.message}。请确认服务器已安装 Codex CLI，并执行 codex login --device-auth 完成设备登录。`
        )
        closeWithDone()
      })

      codexProcess.on('close', code => {
        if (code !== 0 && !hasOutput) {
          const detail = stderr.trim() || `codex exec exited with code ${code}`
          enqueueText(
            `ChatGPT 调用失败：${detail}\n\n请确认服务器已安装 Codex CLI，并执行 codex login --device-auth 完成设备登录。`
          )
        }

        closeWithDone()
      })
    },

    cancel() {
      codexProcess.kill('SIGTERM')
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
